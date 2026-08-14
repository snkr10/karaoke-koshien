"use client";

import { CSSProperties, ReactNode } from "react";
import { colors } from "@/lib/theme";

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: colors.card,
        borderRadius: 14,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
