import { Card, CardHeader, CardContent } from "../../components/ui/card";
import { getListHaikus, getLatestSetting } from "../../lib/actions";
import ListClient from "./ListClient";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Suspense } from "react";

export default async function ListPage() {
  const haikus = await getListHaikus();
  const setting = await getLatestSetting();
  const isAdminToken = process.env.IS_ADMIN_TOKEN ?? "";

  return (
    <div className="max-w-4xl mx-auto p-4 min-w-[360px]">
      <Card>
        <CardHeader className="text-center text-2xl font-bold text-gray-800 text-xs-responsive">
          投句一覧
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Suspense fallback={<LoadingSpinner />}>
            <ListClient
              haikus={haikus}
              setting={setting}
              isAdminToken={isAdminToken}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
