"use client";

import { colors, fonts } from "@/lib/theme";

export function Avatar({
  name,
  avatarType,
  avatarValue,
  size = 34,
}: {
  name: string;
  avatarType?: string | null;
  avatarValue?: string | null;
  size?: number;
}) {
  const base = {
    width: size,
    height: size,
    borderRadius: "50%",
    background: "rgba(245,241,230,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  } as const;

  if (avatarType === "photo" && avatarValue) {
    return (
      <div style={base}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarValue} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }

  if (avatarType === "preset" && avatarValue) {
    return (
      <div style={{ ...base, fontSize: size * 0.55 }}>
        <span>{avatarValue}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        ...base,
        fontFamily: fonts.heading,
        fontWeight: 700,
        fontSize: size * 0.4,
        color: colors.cream,
      }}
    >
      {name.slice(0, 1)}
    </div>
  );
}
