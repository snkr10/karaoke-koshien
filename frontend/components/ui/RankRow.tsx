"use client";

import { colors, fonts } from "@/lib/theme";

export function RankRow({
  rank,
  name,
  display,
  isFirst,
  compact,
}: {
  rank: number;
  name: string;
  display: string;
  isFirst: boolean;
  compact?: boolean;
}) {
  const padding = compact ? "12px 16px" : "14px 16px";
  if (isFirst) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: colors.goldBg,
          border: `1px solid ${colors.goldBorder}`,
          borderRadius: 12,
          padding,
        }}
      >
        <div style={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: compact ? 16 : 18, color: colors.gold, width: 20 }}>
          {rank}
        </div>
        <div style={{ flex: 1, fontFamily: fonts.heading, fontWeight: 700, fontSize: compact ? 15 : 17, color: colors.gold }}>
          {name}
        </div>
        <div style={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: compact ? 14 : 16, color: colors.gold }}>
          {display}
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: colors.card,
        borderRadius: 12,
        padding,
      }}
    >
      <div
        style={{
          fontFamily: fonts.mono,
          fontWeight: 700,
          fontSize: compact ? 16 : 18,
          color: colors.creamDim50,
          width: 20,
        }}
      >
        {rank}
      </div>
      <div style={{ flex: 1, fontFamily: fonts.heading, fontWeight: 700, fontSize: compact ? 15 : 17, color: colors.cream }}>
        {name}
      </div>
      <div style={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: compact ? 14 : 16, color: colors.creamDim70 }}>
        {display}
      </div>
    </div>
  );
}
