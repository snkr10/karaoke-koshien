"use client";

import { colors, fonts } from "@/lib/theme";
import { Avatar } from "@/components/ui/Avatar";

export function RankRow({
  rank,
  name,
  display,
  isFirst,
  compact,
  index,
  avatarType,
  avatarValue,
}: {
  rank: number;
  name: string;
  display: string;
  isFirst: boolean;
  compact?: boolean;
  index?: number;
  avatarType?: string | null;
  avatarValue?: string | null;
}) {
  const padding = compact ? "12px 16px" : "14px 16px";
  const animationDelay = index != null ? `${index * 60}ms` : undefined;
  if (isFirst) {
    return (
      <div
        className="kk-item-enter"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: colors.goldBg,
          border: `1px solid ${colors.goldBorder}`,
          borderRadius: 12,
          padding,
          animationDelay,
        }}
      >
        <div style={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: compact ? 16 : 18, color: colors.gold, width: 20 }}>
          {rank}
        </div>
        <Avatar name={name} avatarType={avatarType} avatarValue={avatarValue} size={compact ? 26 : 30} />
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
      className="kk-item-enter"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: colors.card,
        borderRadius: 12,
        padding,
        animationDelay,
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
      <Avatar name={name} avatarType={avatarType} avatarValue={avatarValue} size={compact ? 26 : 30} />
      <div style={{ flex: 1, fontFamily: fonts.heading, fontWeight: 700, fontSize: compact ? 15 : 17, color: colors.cream }}>
        {name}
      </div>
      <div style={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: compact ? 14 : 16, color: colors.creamDim70 }}>
        {display}
      </div>
    </div>
  );
}
