"use client";

import React from "react";
import { Button } from "../components/ui/button";
import { Table, TableRow, TableCell, TableBody } from "../components/ui/table";

interface DisplayComponentProps {
  haiku: string;
  haijinName: string;
  talkId: number;
  handleCheckWinning: () => void;
}

const DisplayComponent: React.FC<DisplayComponentProps> = ({
  haiku,
  haijinName,
  talkId,
  handleCheckWinning,
}) => {
  const handlePostToX = () => {
    const text = `大吉祥寺.pm #ミニ句会 で投句しました！\n${haiku}\n（詠み人：${haijinName}／投句番号：${talkId}）\n#kichijojipm`;
    const url = `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <Table className="w-full text-left border-collapse text-xs-responsive">
      <TableBody>
        <TableRow>
          <TableCell className="py-2 px-4 border-b">一句:</TableCell>
          <TableCell className="py-2 px-4 border-b">{haiku}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="py-2 px-4 border-b">詠み人:</TableCell>
          <TableCell className="py-2 px-4 border-b">{haijinName}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="py-2 px-4 border-b">投句番号:</TableCell>
          <TableCell className="py-2 px-4 border-b">{talkId}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell colSpan={2} className="p-2 text-center">
            <Button
              onClick={handlePostToX}
              className="bg-black hover:bg-gray-500 text-xs-responsive text-white"
            >
              X（旧Twitter）にポスト
            </Button>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell colSpan={2} className="p-2 text-center">
            <Button
              onClick={handleCheckWinning}
              className="bg-orange-500 hover:bg-orange-300 text-xs-responsive text-white hover:text-black"
            >
              審査結果を確認
            </Button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

export default DisplayComponent;
