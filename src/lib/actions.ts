"use server";

import { Pool } from "pg";
import * as dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: Number(process.env.DATABASE_PORT),
});

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
): Promise<{ talk_id: number | null; result: string; token: string | null }> {
  const haiku = formData.get("haiku") as string;
  const haijinName = formData.get("haijin_name") as string;
  const token = uuidv4();

  const talkOn = await getLatestSetting();
  if (talkOn === false) {
    return { talk_id: null, result: "投句可能期間は終了しました", token: null };
  }

  try {
    const client = await pool.connect();
    const result = await client.query(
      "INSERT INTO talk_box (haiku, haijin_name, token, winning) VALUES ($1, $2, $3, $4) RETURNING talk_id, token",
      [haiku, haijinName, token, null]
    );
    client.release();

    return {
      talk_id: result.rows[0].talk_id,
      result: "投句いただきました。ありがとうございます！",
      token: result.rows[0].token,
    };
  } catch (error) {
    console.error("Error inserting haiku:", error);
    return {
      talk_id: null,
      result: "エラーが発生しました。投句できませんでした…",
      token: null,
    };
  }
}

export async function checkWinning(
  talkId: number,
  token: string
): Promise<string> {
  const talkOn = await getLatestSetting();
  if (talkOn === true) {
    return "まだ審査が行われていません。しばらく待ってからボタンをクリックしてください";
  }

  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT winning FROM talk_box WHERE talk_id = $1 AND token = $2",
      [talkId, token]
    );
    client.release();

    if (result.rowCount !== 1) {
      return "エラーが発生しました。再試行してください";
    }

    const winning = result.rows[0].winning;

    if (winning === null) {
      return "まだ審査が行われていません。しばらく待ってからボタンをクリックしてください";
    }

    return winning;
  } catch (error) {
    console.error("Error checking winning status:", error);
    return "エラーが発生しました。再試行してください";
  }
}
