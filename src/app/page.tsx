"use client";

import { useState, useEffect, useTransition } from "react";
import { addHaiku, checkWinning } from "../lib/actions";
import FormComponent from "./FormComponent";
import DisplayComponent from "./DisplayComponent";
import { Card, CardHeader, CardContent } from "../components/ui/card";

export default function Page() {
  const [haiku, setHaiku] = useState("");
  const [haijinName, setHaijinName] = useState("");
  const [talkId, setTalkId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<{
    haiku?: string;
    haijin_name?: string;
  }>({});
  const [message, setMessage] = useState<string[]>([
    "「ITコミュニティのこれまでと、これから」",
    "をテーマに一句お願いします",
    "（17:00締切）",
  ]);

  useEffect(() => {
    const storedTalkId = localStorage.getItem("talkId");
    const storedHaiku = localStorage.getItem("haiku");
    const storedHaijinName = localStorage.getItem("haijinName");
    const storedToken = localStorage.getItem("token");

    if (storedTalkId) {
      setTalkId(Number(storedTalkId));
      setMessage([
        "投句ありがとうございます！",
        "当選発表をお待ちください！",
        "（17時台後半）",
      ]);
    }

    if (storedHaiku) {
      setHaiku(storedHaiku);
    }

    if (storedHaijinName) {
      setHaijinName(storedHaijinName);
    }

    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const { talk_id, result, token } = await addHaiku(formData);
      setTalkId(talk_id);
      setMessage(result);
      setToken(token);
      if (talk_id && token) {
        localStorage.setItem("talkId", talk_id.toString());
        localStorage.setItem("haiku", formData.get("haiku") as string);
        localStorage.setItem(
          "haijinName",
          formData.get("haijin_name") as string
        );
        localStorage.setItem("token", token);
      }
    });
  };

  const handleCheckWinning = async () => {
    if (talkId !== null && token !== null) {
      const result = await checkWinning(talkId, token);
      setMessage(result);
    } else {
      setMessage(["エラーが発生しました", "再試行してください"]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 min-w-[360px]">
      <Card>
        <CardHeader className="text-center text-2xl font-bold text-gray-800 text-xs-responsive">
          投句箱
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600 mb-4 text-xs-responsive">
            {message.map((line, index) => (
              <span key={index}>
                {line}
                {index < message.length - 1 && <br />}
              </span>
            ))}
          </p>
          {talkId === null ? (
            <FormComponent
              haiku={haiku}
              haijinName={haijinName}
              setHaiku={setHaiku}
              setHaijinName={setHaijinName}
              handleSubmit={handleSubmit}
              errors={errors}
              setErrors={setErrors}
              isPending={isPending}
            />
          ) : (
            <DisplayComponent
              haiku={haiku}
              haijinName={haijinName}
              talkId={talkId}
              handleCheckWinning={handleCheckWinning}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
