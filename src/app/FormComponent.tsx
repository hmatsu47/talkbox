"use client";

import React from "react";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Table, TableRow, TableCell, TableBody } from "../components/ui/table";

interface FormComponentProps {
  haiku: string;
  haijinName: string;
  setHaiku: (haiku: string) => void;
  setHaijinName: (haijinName: string) => void;
  handleSubmit: (formData: FormData) => void;
  errors: { haiku?: string; haijin_name?: string };
  setErrors: (errors: { haiku?: string; haijin_name?: string }) => void;
  isPending: boolean;
}

const FormComponent: React.FC<FormComponentProps> = ({
  haiku,
  haijinName,
  setHaiku,
  setHaijinName,
  handleSubmit,
  errors,
  setErrors,
  isPending,
}) => {
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // Trim whitespace
    const haikuTrimmed = (formData.get("haiku") as string).trim();
    const haijinNameTrimmed = (formData.get("haijin_name") as string).trim();
    formData.set("haiku", haikuTrimmed);
    formData.set("haijin_name", haijinNameTrimmed);
    setHaiku(haikuTrimmed);
    setHaijinName(haijinNameTrimmed);
    localStorage.setItem("haiku", haikuTrimmed);
    localStorage.setItem("haijinName", haijinNameTrimmed);

    // バリデーションチェック
    const haikuSchema = z
      .string()
      .min(6, { message: "6〜25文字で入力してください" })
      .max(25, { message: "6〜25文字で入力してください" });

    const haijinNameSchema = z
      .string()
      .min(1, { message: "1〜25文字で入力してください" })
      .max(25, { message: "1〜25文字で入力してください" });

    const haikuValidation = haikuSchema.safeParse(haikuTrimmed);
    const haijinNameValidation = haijinNameSchema.safeParse(haijinNameTrimmed);

    if (!haikuValidation.success || !haijinNameValidation.success) {
      const newErrors: { haiku?: string; haijin_name?: string } = {};
      if (!haikuValidation.success)
        newErrors.haiku = haikuValidation.error.errors[0].message;
      if (!haijinNameValidation.success)
        newErrors.haijin_name = haijinNameValidation.error.errors[0].message;
      setErrors(newErrors);
      return;
    }

    // バリデーションエラーがない場合に確認ダイアログを表示
    if (confirm("本当に投句しますか？（投句後は修正・再投句できません）")) {
      handleSubmit(formData);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <Table className="w-full text-left border-collapse text-xs-responsive">
        <TableBody>
          <TableRow className="p-2 border-none">
            <TableCell className="p-2 border-none">
              <Label
                htmlFor="haiku"
                className="text-sm font-medium text-gray-700"
              >
                一句:
              </Label>
            </TableCell>
            <TableCell className="p-2 border-none">
              <Input
                type="text"
                name="haiku"
                placeholder="6〜25文字（自由律・無季も可）"
                value={haiku}
                onChange={(e) => setHaiku(e.target.value)}
                required
                className="w-full"
                style={{ width: "32ch" }}
              />
            </TableCell>
          </TableRow>
          <TableRow className="p-2 border-none">
            <TableCell className="p-0 border-none"></TableCell>
            <TableCell className="p-0 border-none">
              <div className="h-5">
                {errors.haiku && (
                  <p className="text-red-500 text-xs">{errors.haiku}</p>
                )}
              </div>
            </TableCell>
          </TableRow>
          <TableRow className="p-2 border-none">
            <TableCell className="p-2 border-none">
              <Label
                htmlFor="haijin_name"
                className="text-sm font-medium text-gray-700"
              >
                詠み人:
              </Label>
            </TableCell>
            <TableCell className="p-2 border-none">
              <Input
                type="text"
                name="haijin_name"
                placeholder="1〜25文字（本名以外を推奨）"
                value={haijinName}
                onChange={(e) => setHaijinName(e.target.value)}
                required
                className="w-full"
                style={{ width: "32ch" }}
              />
            </TableCell>
          </TableRow>
          <TableRow className="p-2 border-none">
            <TableCell className="p-0 border-none"></TableCell>
            <TableCell className="p-0 border-none">
              <div className="h-5">
                {errors.haijin_name && (
                  <p className="text-red-500 text-xs">{errors.haijin_name}</p>
                )}
              </div>
            </TableCell>
          </TableRow>
          <TableRow className="p-2 border-none">
            <TableCell colSpan={2} className="p-2 text-center border-none">
              <Button
                type="submit"
                disabled={isPending}
                className="bg-orange-500 text-white hover:bg-orange-300 text-xs-responsive"
              >
                投句
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </form>
  );
};

export default FormComponent;
