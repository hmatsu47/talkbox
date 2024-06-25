"use client";

import React from "react";

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
    <table>
      <tbody>
        <tr>
          <td>一句:</td>
          <td>{haiku}</td>
        </tr>
        <tr>
          <td>詠み人:</td>
          <td>{haijinName}</td>
        </tr>
        <tr>
          <td>投句番号:</td>
          <td>{talkId}</td>
        </tr>
        <tr>
          <td colSpan={2} style={{ textAlign: "center" }}>
            <button onClick={handleCheckWinning}>当選結果を確認</button>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default DisplayComponent;
