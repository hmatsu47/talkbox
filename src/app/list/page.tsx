import { Pool } from "pg";
import * as dotenv from "dotenv";
import { Card, CardHeader, CardContent } from "../../components/ui/card";
import ListClient from "./ListClient";

dotenv.config();

const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: Number(process.env.DATABASE_PORT),
});

async function getAllHaikus() {
  const client = await pool.connect();
  const query =
    "SELECT talk_id, haijin_name, haiku, hand_over, winning FROM talk_box ORDER BY talk_id ASC";
  const result = await client.query(query);
  client.release();
  return result.rows;
}

export default async function ListPage() {
  const haikus = await getAllHaikus();
  const isAdminToken = process.env.IS_ADMIN_TOKEN ?? "";

  return (
    <div className="max-w-4xl mx-auto p-4 min-w-[360px]">
      <Card>
        <CardHeader className="text-center text-2xl font-bold text-gray-800 text-xs-responsive">
          投句一覧
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <ListClient haikus={haikus} isAdminToken={isAdminToken} />
        </CardContent>
      </Card>
    </div>
  );
}
