"use server";

import { Pool } from "pg";
import * as dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import pgvector from "pgvector/pg";
import { cache } from "react";
import { revalidatePath } from "next/cache";

dotenv.config();

const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: Number(process.env.DATABASE_PORT),
});

async function getEmbedding(text: string): Promise<number[] | null> {
  const client = new BedrockRuntimeClient({ region: "ap-northeast-1" });
  const command = new InvokeModelCommand({
    modelId: "cohere.embed-multilingual-v3",
    body: JSON.stringify({
      texts: [text],
      input_type: "search_document",
    }),
    accept: "*/*",
    contentType: "application/json",
  });

  try {
    const response = await client.send(command);
    const responseBody = await response.body.transformToString();
    const embedding = JSON.parse(responseBody).embeddings[0];
    return embedding;
  } catch (error) {
    console.error("Error fetching embedding:", error);
    return null;
  }
}

export const getLatestSetting = cache(async () => {
  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT talk_on, win_fin FROM setting ORDER BY setting_id DESC LIMIT 1"
    );
    client.release();
    return result.rows[0];
  } catch (error) {
    console.error("Error fetching setting:", error);
    const result = {
      talk_on: true,
      win_fin: false,
    };
    return result;
  }
});

export const getListHaikus = cache(async () => {
  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT talk_id, haijin_name, haiku, hand_over, winning FROM talk_box ORDER BY talk_id ASC"
    );
    client.release();
    return result.rows;
  } catch (error) {
    console.error("Error fetching talk_box:", error);
    return [];
  }
});

export async function addHaiku(
  formData: FormData
): Promise<{ talk_id: number | null; result: string[]; token: string | null }> {
  const haiku = (formData.get("haiku") as string).trim();
  const haijinName = (formData.get("haijin_name") as string).trim();
  const token = uuidv4();

  const latestSetting = await getLatestSetting();
  const talkOn = latestSetting.talk_on;

  if (talkOn === false) {
    return {
      talk_id: null,
      result: ["投句可能期間は終了しました"],
      token: null,
    };
  }

  if (haiku.length < 6 || haiku.length > 25) {
    return {
      talk_id: null,
      result: ["6〜25文字で入力してください"],
      token: null,
    };
  }

  if (haijinName.length < 1 || haijinName.length > 25) {
    return {
      talk_id: null,
      result: ["1〜25文字で入力してください"],
      token: null,
    };
  }

  const embedding = await getEmbedding(haiku);
  if (embedding === null) {
    return {
      talk_id: null,
      result: ["エラーが発生しました", "再試行してください"],
      token: null,
    };
  }

  try {
    const client = await pool.connect();
    await pgvector.registerType(client);
    const result = await client.query(
      "INSERT INTO talk_box (haiku, haijin_name, token, winning, embedding, hand_over) VALUES ($1, $2, $3, $4, $5, $6) RETURNING talk_id, token",
      [haiku, haijinName, token, null, pgvector.toSql(embedding), 0]
    );

    const goodsCount = Number(process.env.GOODS_COUNT || 0);
    const sumHandOverResult = await client.query(
      "SELECT SUM(hand_over) as sum_hand_over FROM talk_box"
    );
    const sumHandOver = sumHandOverResult.rows[0].sum_hand_over || 0;

    client.release();

    if (sumHandOver >= goodsCount) {
      return {
        talk_id: result.rows[0].talk_id,
        result: [
          "投句ありがとうございます！",
          "",
          "AI(?)審査による入選作発表があります！",
          "（当日17時台後半のLT内で発表予定）",
          "",
          "X（旧Twitter）へのポストもぜひ！",
        ],
        token: result.rows[0].token,
      };
    } else {
      return {
        talk_id: result.rows[0].talk_id,
        result: [
          "投句ありがとうございます！",
          "",
          `当日参加の方、先着${goodsCount}名様に`,
          "プレゼントがあります！",
          "",
          "会場でhmatsu47(まつ)を見つけて、",
          "この画面をお見せください！",
          "",
          "午後の休憩時間はロビー周辺にいます！",
          "",
          "AI(?)審査による入選作発表もあります！",
          "（当日17時台後半のLT内で発表予定）",
          "",
          "X（旧Twitter）へのポストもぜひ！",
        ],
        token: result.rows[0].token,
      };
    }
  } catch (error: any) {
    if (error.code === "23505") {
      return {
        talk_id: null,
        result: ["エラーが発生しました", "同一の句は投句できません"],
        token: null,
      };
    }
    console.error("Error inserting haiku:", error);
    return {
      talk_id: null,
      result: ["エラーが発生しました", "投句できませんでした…"],
      token: null,
    };
  }
}

export async function checkWinning(
  talkId: number,
  token: string
): Promise<string[]> {
  const latestSetting = await getLatestSetting();
  const winFin = latestSetting.win_fin;
  const talkOn = latestSetting.talk_on;

  if (winFin === false || talkOn === true) {
    return [
      "まだ審査が行われていません",
      "発表をお待ちください！",
      "（当日17時台後半のLT内で発表予定）",
    ];
  }

  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT hand_over, winning FROM talk_box WHERE talk_id = $1 AND token = $2",
      [talkId, token]
    );
    client.release();

    if (result.rowCount !== 1) {
      return ["エラーが発生しました", "再試行してください"];
    }

    const winning = result.rows[0].winning;

    if (winning === null) {
      return ["入選ならず…残念！"];
    }

    return [winning];
  } catch (error) {
    console.error("Error checking winning status:", error);
    return ["エラーが発生しました", "再試行してください"];
  }
}

export const toggleTalkOn = cache(async () => {
  const latestSetting = await getLatestSetting();
  const newTalkOn = !latestSetting.talk_on;

  const client = await pool.connect();
  await client.query(
    "UPDATE setting SET talk_on = $1 WHERE setting_id = (SELECT MAX(setting_id) FROM setting)",
    [newTalkOn]
  );
  client.release();

  return newTalkOn;
});

export const performDraw = cache(async () => {
  const latestSetting = await getLatestSetting();
  if (latestSetting.talk_on === true) {
    return "審査は投句終了後に行ってください。";
  }

  const baseAnswer = process.env.BASE_ANSWER || "";
  const winCount = Number(process.env.WIN_COUNT || 0);

  const baseEmbedding = await getEmbedding(baseAnswer);
  if (baseEmbedding === null) {
    return "エラーが発生しました。再試行してください。";
  }

  try {
    const client = await pool.connect();
    await pgvector.registerType(client);

    // 最初に winning が null でない行を null に更新
    await client.query(
      "UPDATE talk_box SET winning = null WHERE winning IS NOT NULL"
    );

    await client.query(
      "UPDATE talk_box SET winning = '入選しました！おめでとうございます！' WHERE talk_id IN (SELECT talk_id FROM talk_box ORDER BY (embedding <#> $1) * -1 DESC LIMIT $2)",
      [pgvector.toSql(baseEmbedding), winCount]
    );

    await client.query(
      "UPDATE setting SET win_fin = true WHERE setting_id = (SELECT MAX(setting_id) FROM setting)"
    );

    client.release();
    return "審査が完了しました。";
  } catch (error) {
    console.error("Error performing draw:", error);
    return "エラーが発生しました。再試行してください。";
  }
});

export const toggleHandOver = cache(
  async (talkId: number): Promise<number | null> => {
    try {
      const client = await pool.connect();
      const result = await client.query(
        "UPDATE talk_box SET hand_over = CASE WHEN hand_over = 0 THEN 1 ELSE 0 END WHERE talk_id = $1 RETURNING hand_over",
        [talkId]
      );
      client.release();
      return result.rows[0].hand_over;
    } catch (error) {
      console.error("Error toggling hand_over status:", error);
      return null;
    }
  }
);

export async function handleRevalidatePath(path: string) {
  revalidatePath(path);
}
