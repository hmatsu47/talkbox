"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/tabs";
import { HaikuTable } from "./HaikuTable";

export default function ListClient({
  haikus,
  isAdminToken,
}: {
  haikus: {
    talk_id: number;
    haijin_name: string;
    haiku: string;
    hand_over: number;
    winning: string | null;
  }[];
  isAdminToken: string;
}) {
  const [filter, setFilter] = useState<string>("all");
  const router = useRouter();

  useEffect(() => {
    const storedIsAdminToken = localStorage.getItem("is_admin_token");
    if (storedIsAdminToken !== isAdminToken) {
      router.push("/");
    }
  }, [isAdminToken, router]);

  const filteredHaikus = haikus.filter((haiku) => {
    if (filter === "unhanded") {
      return haiku.hand_over === 0;
    } else if (filter === "handed") {
      return haiku.hand_over > 0;
    } else if (filter === "winning") {
      return haiku.winning && haiku.winning.startsWith("当選");
    }
    return true; // 'all' or any other value
  });

  return (
    <div className="max-w-4xl mx-auto p-4 min-w-[360px]">
      <Tabs defaultValue={filter} onValueChange={(value) => setFilter(value)}>
        <TabsList className="mb-4">
          <TabsTrigger value="all" className="text-xs-responsive">
            全て
          </TabsTrigger>
          <TabsTrigger value="unhanded" className="text-xs-responsive">
            未渡
          </TabsTrigger>
          <TabsTrigger value="handed" className="text-xs-responsive">
            渡済
          </TabsTrigger>
          <TabsTrigger value="winning" className="text-xs-responsive">
            当選
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <HaikuTable haikus={filteredHaikus} />
        </TabsContent>
        <TabsContent value="unhanded">
          <HaikuTable haikus={filteredHaikus} />
        </TabsContent>
        <TabsContent value="handed">
          <HaikuTable haikus={filteredHaikus} />
        </TabsContent>
        <TabsContent value="winning">
          <HaikuTable haikus={filteredHaikus} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
