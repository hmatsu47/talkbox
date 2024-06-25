"use client";

import { useState, useEffect, useTransition } from "react";
import { z } from "zod";
import { addHaiku, checkWinning } from "../lib/actions";
import FormComponent from "./FormComponent";
import DisplayComponent from "./DisplayComponent";

const haikuSchema = z
  .string()
  .min(6, { message: "一句は6文字以上25文字以内である必要があります。" })
  .max(25, { message: "一句は6文字以上25文字以内である必要があります。" });

const haijinNameSchema = z
  .string()
  .min(1, { message: "詠み人は1文字以上25文字以内である必要があります。" })
  .max(25, { message: "詠み人は1文字以上25文字以内である必要があります。" });

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
  const [message, setMessage] = useState(
    "自由律・無季で構いません。一句お願いします"
  );

  useEffect(() => {
    const storedTalkId = localStorage.getItem("talkId");
    const storedHaiku = localStorage.getItem("haiku");
    const storedHaijinName = localStorage.getItem("haijinName");
    const storedToken = localStorage.getItem("token");

    if (storedTalkId) {
      setTalkId(Number(storedTalkId));
      setMessage("投句いただきました。ありがとうございます！");
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
    const haikuValidation = haikuSchema.safeParse(formData.get("haiku"));
    const haijinNameValidation = haijinNameSchema.safeParse(
      formData.get("haijin_name")
    );

    if (!haikuValidation.success || !haijinNameValidation.success) {
      const newErrors: { haiku?: string; haijin_name?: string } = {};
      if (!haikuValidation.success)
        newErrors.haiku = haikuValidation.error.errors[0].message;
      if (!haijinNameValidation.success)
        newErrors.haijin_name = haijinNameValidation.error.errors[0].message;
      setErrors(newErrors);
      return;
    }

    setErrors({});
    startTransition(async () => {
      const { talk_id, result, token } = await addHaiku(formData);
      setTalkId(talk_id);
      setMessage(result);
      setToken(token);
      if (talk_id && token) {
        localStorage.setItem("talkId", talk_id.toString());
        localStorage.setItem("haiku", haiku);
        localStorage.setItem("haijinName", haijinName);
        localStorage.setItem("token", token);
      }
    });
  };

  const handleCheckWinning = async () => {
    if (talkId !== null && token !== null) {
      const result = await checkWinning(talkId, token);
      setMessage(result);
    } else {
      setMessage("エラーが発生しました。再試行してください");
    }
  };

  return (
    <div>
      <h2>投句箱</h2>
      <p>{message}</p>
      {talkId === null ? (
        <FormComponent
          haiku={haiku}
          haijinName={haijinName}
          setHaiku={setHaiku}
          setHaijinName={setHaijinName}
          handleSubmit={handleSubmit}
          errors={errors}
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
    </div>
  );
}
