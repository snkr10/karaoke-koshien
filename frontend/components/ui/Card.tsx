"use client";

import { CSSProperties, ReactNode } from "react";
import { colors } from "@/lib/theme";

export function Card({
  children,
  style,
  index,
}: {
  children: ReactNode;
  style?: CSSProperties;
  index?: number;
}) {
  return (
    <div
      className="kk-item-enter"
      style={{
        background: colors.card,
        borderRadius: 14,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        animationDelay: index != null ? `${index * 60}ms` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
