"use client";

import { CSSProperties, ReactNode } from "react";
import { colors, fonts } from "@/lib/theme";

export function ScreenShell({
  children,
  padding = "72px 24px 28px",
  align = "stretch",
  onClick,
}: {
  children: ReactNode;
  padding?: string;
  align?: CSSProperties["alignItems"];
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        minHeight: "100dvh",
        width: "100%",
        background: colors.bg,
        fontFamily: fonts.body,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        cursor: onClick ? "pointer" : undefined,
      }}
    >
      <div
        className="kk-screen-enter"
        style={{
          flex: 1,
          padding,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          alignItems: align,
          boxSizing: "border-box",
          maxWidth: 480,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function ScreenHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div
        style={{
          fontFamily: fonts.heading,
          fontWeight: 400,
          fontSize: 11,
          letterSpacing: "0.25em",
          color: colors.creamDim40,
          textTransform: "uppercase",
        }}
      >
        {kicker}
      </div>
      <div style={{ fontFamily: fonts.heading, fontWeight: 900, fontSize: 24, color: colors.cream }}>
        {title}
      </div>
    </div>
  );
}
