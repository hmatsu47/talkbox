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

const GOODS_COUNT = Number(process.env.GOODS_COUNT);

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
    "SELECT talk_on FROM setting ORDER BY setting_id DESC LIMIT 1"
  );
  client.release();
  return result.rows[0]?.talk_on;
}

export async function addHaiku(
  formData: FormData
): Promise<{ talk_id: number | null; result: string[]; token: string | null }> {
  const haiku = (formData.get("haiku") as string).trim();
  const haijinName = (formData.get("haijin_name") as string).trim();
  const token = uuidv4();

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

  const talkOn = await getLatestSetting();
  if (talkOn === false) {
    return {
      talk_id: null,
      result: ["投句可能期間は終了しました"],
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

    const sumResult = await client.query(
      "SELECT SUM(hand_over) AS total_hand_over FROM talk_box"
    );

    const totalHandOver = sumResult.rows[0].total_hand_over;

    let responseMessage: string[];
    if (totalHandOver >= GOODS_COUNT) {
      responseMessage = [
        "投句ありがとうございます！",
        "当選発表をお待ちください！",
        "（17時台後半）",
      ];
    } else {
      responseMessage = [
        "投句ありがとうございます！",
        `先着${GOODS_COUNT}名様にプレゼントがあります！`,
        "休憩時間中お早めに受付まで",
        "（17:00締切／別途抽選あり）",
      ];
    }

    client.release();

    return {
      talk_id: result.rows[0].talk_id,
      result: responseMessage,
      token: result.rows[0].token,
    };
  } catch (error) {
    if ((error as any).code === "23505") {
      // Unique violation
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
  const talkOn = await getLatestSetting();
  if (talkOn === true) {
    return [
      "まだ抽選が行われていません",
      "当選発表をお待ちください！",
      "（17時台後半）",
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
      return [
        "まだ抽選が行われていません",
        "当選発表をお待ちください！",
        "（17時台後半）",
      ];
    }

    return [winning];
  } catch (error) {
    console.error("Error checking winning status:", error);
    return ["エラーが発生しました", "再試行してください"];
  }
}
