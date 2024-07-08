"use client";

import { Button } from "../../components/ui/button";
import { handleRevalidatePath, toggleHandOver } from "../../lib/actions";

interface Haiku {
  talk_id: number;
  haijin_name: string;
  haiku: string;
  hand_over: number;
  winning: string | null;
}

export function HaikuTable({
  filteredHaikus,
  setHaikus,
  setFilteredHaikus,
  filter,
}: {
  filteredHaikus: Haiku[];
  setHaikus: React.Dispatch<React.SetStateAction<Haiku[]>>;
  setFilteredHaikus: React.Dispatch<React.SetStateAction<Haiku[]>>;
  filter: string;
}) {
  const handleToggle = async (talkId: number) => {
    const updated = await toggleHandOver(talkId);
    if (updated !== null) {
      setHaikus((prevHaikus) =>
        prevHaikus.map((haiku) =>
          haiku.talk_id === talkId ? { ...haiku, hand_over: updated } : haiku
        )
      );
      setFilteredHaikus((prevHaikus) =>
        prevHaikus.map((haiku) =>
          haiku.talk_id === talkId ? { ...haiku, hand_over: updated } : haiku
        )
      );
      handleRevalidatePath("list");
    }
  };

  if (filteredHaikus.length === 0) {
    return (
      <p className="text-center text-gray-600 text-xs-responsive">
        該当する投句はありません。
      </p>
    );
  }

  return (
    <table className="min-w-full bg-white border border-gray-300 text-xs-responsive">
      <thead>
        <tr>
          <th className="py-2 px-4 border-b text-right">番号</th>
          <th className="py-2 px-4 border-b">詠み人・句</th>
        </tr>
      </thead>
      <tbody>
        {filteredHaikus.map((haiku, index) => (
          <tr
            key={haiku.talk_id}
            className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}
          >
            <td className="py-2 px-4 border-b text-right">
              <div className="flex items-center justify-end">
                {filter === "winning" ? (
                  ""
                ) : (
                  <Button
                    onClick={() => handleToggle(haiku.talk_id)}
                    className={`text-xs-responsive mr-2 ${
                      haiku.hand_over === 0
                        ? "bg-orange-500 hover:bg-orange-300 text-white hover:text-black"
                        : "bg-orange-300 hover:bg-orange-500 text-black hover:text-white"
                    }`}
                  >
                    {haiku.hand_over === 0 ? "未" : "済"}
                  </Button>
                )}
                <span>{haiku.talk_id}</span>
              </div>
            </td>
            <td className="py-2 px-4 border-b">
              <div>{haiku.haijin_name}</div>
              <div className="text-gray-600">{haiku.haiku}</div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
