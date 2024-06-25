"use client";

import React from "react";

interface FormComponentProps {
  haiku: string;
  haijinName: string;
  setHaiku: (haiku: string) => void;
  setHaijinName: (haijinName: string) => void;
  handleSubmit: (formData: FormData) => void;
  errors: { haiku?: string; haijin_name?: string };
  isPending: boolean;
}

const FormComponent: React.FC<FormComponentProps> = ({
  haiku,
  haijinName,
  setHaiku,
  setHaijinName,
  handleSubmit,
  errors,
  isPending,
}) => {
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSubmit(new FormData(event.currentTarget));
  };

  return (
    <form onSubmit={onSubmit}>
      <table>
        <tbody>
          <tr>
            <td>
              <label htmlFor="haiku">一句:</label>
            </td>
            <td>
              <input
                type="text"
                name="haiku"
                placeholder="6文字以上25文字以内"
                value={haiku}
                onChange={(e) => setHaiku(e.target.value)}
                required
              />
              {errors.haiku && <p style={{ color: "red" }}>{errors.haiku}</p>}
            </td>
          </tr>
          <tr>
            <td>
              <label htmlFor="haijin_name">詠み人:</label>
            </td>
            <td>
              <input
                type="text"
                name="haijin_name"
                placeholder="1文字以上25文字以内"
                value={haijinName}
                onChange={(e) => setHaijinName(e.target.value)}
                required
              />
              {errors.haijin_name && (
                <p style={{ color: "red" }}>{errors.haijin_name}</p>
              )}
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{ textAlign: "center" }}>
              <button type="submit" disabled={isPending}>
                投句
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </form>
  );
};

export default FormComponent;
