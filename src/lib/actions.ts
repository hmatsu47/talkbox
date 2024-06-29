"use server";

import { Pool } from "pg";
import * as dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import pgvector from "pgvector/pg";

dotenv.config();

const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: Number(process.env.DATABASE_PORT),
});

async function getEmbedding(text: string): Promise<number[] | null> {
  const client = new BedrockRuntimeClient({ region: "us-west-2" });
  const command = new InvokeModelCommand({
    modelId: "amazon.titan-embed-text-v2:0",
    body: JSON.stringify({
      inputText: text,
      dimensions: 1024,
      normalize: true,
    }),
    contentType: "application/json",
  });

  try {
    const response = await client.send(command);
    const responseBody = await response.body.transformToString();
    const embedding = JSON.parse(responseBody).embedding;
    return embedding;
  } catch (error) {
    console.error("Error fetching embedding:", error);
    return null;
  }
}

async function getLatestSetting() {
  const client = await pool.connect();
  const result = await client.query(
    "SELECT talk_on, win_fin FROM setting ORDER BY setting_id DESC LIMIT 1"
  );
  client.release();
  return result.rows[0];
}

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
          "当選発表をお待ちください！",
          "（17時台後半LTにて）",
        ],
        token: result.rows[0].token,
      };
    } else {
      return {
        talk_id: result.rows[0].talk_id,
        result: [
          "投句ありがとうございます！",
          `先着${goodsCount}名様にプレゼントがあります！`,
          "休憩時間中お早めに受付まで！",
          "※この画面を見せてください",
          "（17:00締切／LTで別途抽選あり）",
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
      "まだ抽選が行われていません",
      "当選発表をお待ちください！",
      "（17時台後半LTにて）",
    ];
  }

  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT winning FROM talk_box WHERE talk_id = $1 AND token = $2",
      [talkId, token]
    );
    client.release();

    if (result.rowCount !== 1) {
      return ["エラーが発生しました", "再試行してください"];
    }

    const winning = result.rows[0].winning;

    if (winning === null) {
      return ["残念、はずれです"];
    }

    return [winning];
  } catch (error) {
    console.error("Error checking winning status:", error);
    return ["エラーが発生しました", "再試行してください"];
  }
}

export async function toggleTalkOn() {
  const latestSetting = await getLatestSetting();
  const newTalkOn = !latestSetting.talk_on;

  const client = await pool.connect();
  await client.query(
    "UPDATE setting SET talk_on = $1 WHERE setting_id = (SELECT MAX(setting_id) FROM setting)",
    [newTalkOn]
  );
  client.release();

  return newTalkOn;
}

export async function performDraw() {
  const latestSetting = await getLatestSetting();
  if (latestSetting.talk_on === true) {
    return "抽選は投句終了後に行ってください。";
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
      "UPDATE talk_box SET winning = '当選しました！おめでとうございます' WHERE talk_id IN (SELECT talk_id FROM talk_box ORDER BY (embedding <#> $1) * -1 DESC LIMIT $2)",
      [pgvector.toSql(baseEmbedding), winCount]
    );

    await client.query(
      "UPDATE setting SET win_fin = true WHERE setting_id = (SELECT MAX(setting_id) FROM setting)"
    );

    client.release();
    return "抽選が完了しました。";
  } catch (error) {
    console.error("Error performing draw:", error);
    return "エラーが発生しました。再試行してください。";
  }
}

export async function toggleHandOver(talkId: number): Promise<number | null> {
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
