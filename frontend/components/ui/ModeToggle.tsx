"use client";

import { colors, fonts } from "@/lib/theme";
import { RoundMode } from "@/lib/roundActions";

const OPTIONS: { value: RoundMode | null; label: string }[] = [
  { value: null, label: "ランダム" },
  { value: "individual", label: "個人戦" },
  { value: "team", label: "チーム戦" },
];

export function ModeToggle({
  value,
  onChange,
}: {
  value: RoundMode | null;
  onChange: (v: RoundMode | null) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontFamily: fonts.heading, fontSize: 12, letterSpacing: "0.1em", color: colors.creamDim50 }}>
        次のラウンドのモード
      </div>
      <div style={{ display: "flex", background: colors.creamBg06, borderRadius: 10, padding: 4, gap: 4 }}>
        {OPTIONS.map((opt) => {
          const active = opt.value === value;
          return (
            <div
              key={opt.label}
              onClick={() => onChange(opt.value)}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "9px 4px",
                borderRadius: 8,
                background: active ? colors.cream : "transparent",
                color: active ? colors.bg : colors.creamDim50,
                fontFamily: fonts.heading,
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                transition: "background 0.15s ease, color 0.15s ease",
              }}
            >
              {opt.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
