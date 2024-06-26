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
  return (
    <Table className="w-full text-left border-collapse">
      <TableBody>
        <TableRow>
          <TableCell className="p-2 border-b">一句:</TableCell>
          <TableCell className="p-2 border-b">{haiku}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="p-2 border-b">詠み人:</TableCell>
          <TableCell className="p-2 border-b">{haijinName}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="p-2 border-b">投句番号:</TableCell>
          <TableCell className="p-2 border-b">{talkId}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell colSpan={2} className="p-2 text-center">
            <Button
              onClick={handleCheckWinning}
              className="bg-orange-500 text-white"
            >
              当選結果を確認
            </Button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

export default DisplayComponent;
