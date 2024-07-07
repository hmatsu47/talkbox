"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/tabs";
import { HaikuTable } from "./HaikuTable";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Button } from "../../components/ui/button";
import {
  toggleTalkOn,
  performDraw,
  handleRevalidatePath,
  getListHaikus,
  getLatestSetting,
} from "../../lib/actions";

interface Haiku {
  talk_id: number;
  haijin_name: string;
  haiku: string;
  hand_over: number;
  winning: string | null;
}

export default function ListClient({ isAdminToken }: { isAdminToken: string }) {
  const [filter, setFilter] = useState<string>("all");
  const [talkOn, setTalkOn] = useState<boolean>(true);
  const [winFin, setWinFin] = useState<boolean>(false);
  const [haikus, setHaikus] = useState<Haiku[]>([]);
  const [filteredHaikus, setFilteredHaikus] = useState<Haiku[]>(haikus);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedIsAdminToken = localStorage.getItem("isAdminToken");
    if (storedIsAdminToken !== isAdminToken) {
      router.push("/");
    } else {
      setIsLoading(false);
      loadInitialHaikusAndSetting();
    }
  }, [isAdminToken, router]);

  useEffect(() => {
    const filtered = haikus.filter((haiku) => {
      // if (filter === "unhanded") {
      //   return haiku.hand_over === 0;
      // } else if (filter === "handed") {
      //   return haiku.hand_over > 0;
      // } else if (filter === "winning") {
      if (filter === "winning") {
        return haiku.winning;
      }
      return true; // 'all' or any other value
    });
    setFilteredHaikus(filtered);
  }, [filter, haikus]);

  const loadInitialHaikusAndSetting = async () => {
    const initialHaikus = await getListHaikus();
    const initialSetting = await getLatestSetting();
    setHaikus(initialHaikus);
    setFilteredHaikus(initialHaikus);
    setTalkOn(initialSetting.talk_on);
    setWinFin(initialSetting.win_fin);
  };

  const handleToggleTalkOn = async () => {
    const newTalkOn = await toggleTalkOn();
    setTalkOn(newTalkOn);
    handleRevalidatePath("list");
  };

  const handlePerformDraw = async () => {
    const message = await performDraw();
    alert(message);
    setWinFin(true);
    handleRevalidatePath("list");
    // router.refresh(); // キャッシュフラッシュ
  };

  return (
    <div className="max-w-4xl mx-auto p-4 min-w-[360px]">
      <Suspense fallback={<LoadingSpinner />}>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="flex justify-start mb-4 space-x-2">
              <Button
                onClick={handleToggleTalkOn}
                className="bg-orange-500 hover:bg-orange-300 text-xs-responsive text-white hover:text-black"
              >
                {talkOn ? "投句終了" : "投句再開"}
              </Button>
              <Button
                onClick={handlePerformDraw}
                disabled={talkOn}
                className="bg-orange-500 hover:bg-orange-300 text-xs-responsive text-white hover:text-black"
              >
                {winFin ? "再審査" : "AI審査"}
              </Button>
            </div>
            <Tabs
              defaultValue={filter}
              onValueChange={(value) => setFilter(value)}
            >
              <TabsList className="mb-4">
                <TabsTrigger value="all" className="text-xs-responsive">
                  全て
                </TabsTrigger>
                {/* <TabsTrigger value="unhanded" className="text-xs-responsive">
                  未渡
                </TabsTrigger>
                <TabsTrigger value="handed" className="text-xs-responsive">
                  渡済
                </TabsTrigger> */}
                <TabsTrigger value="winning" className="text-xs-responsive">
                  入選
                </TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <HaikuTable
                  haikus={filteredHaikus}
                  setHaikus={setFilteredHaikus}
                  router={router}
                />
              </TabsContent>
              {/* <TabsContent value="unhanded">
                <HaikuTable
                  haikus={filteredHaikus}
                  setHaikus={setFilteredHaikus}
                  router={router}
                />
              </TabsContent>
              <TabsContent value="handed">
                <HaikuTable
                  haikus={filteredHaikus}
                  setHaikus={setFilteredHaikus}
                  router={router}
                />
              </TabsContent> */}
              <TabsContent value="winning">
                <HaikuTable
                  haikus={filteredHaikus}
                  setHaikus={setFilteredHaikus}
                  router={router}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </Suspense>
    </div>
  );
}
