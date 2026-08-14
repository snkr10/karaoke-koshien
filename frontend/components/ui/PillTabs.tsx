"use client";

import { colors, fonts } from "@/lib/theme";

export function PillTabs({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", background: colors.creamBg06, borderRadius: 10, padding: 4, gap: 4 }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <div
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              textAlign: "center",
              padding: 10,
              borderRadius: 8,
              background: active ? colors.cream : "transparent",
              color: active ? colors.bg : colors.creamDim50,
              fontFamily: fonts.heading,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {opt.label}
          </div>
        );
      })}
    </div>
  );
}
