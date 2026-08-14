"use client";

import { useEffect, useState } from "react";
import { FinalResult } from "@/lib/types";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { colors, fonts } from "@/lib/theme";

export function FinalRevealView({ finalResult }: { finalResult: FinalResult }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 2600);
    return () => clearTimeout(timer);
  }, []);

  const format = (value: number) => (finalResult.metric === "total_score" ? `${value.toFixed(1)}点` : `${value}P`);
  const winner = finalResult.ranking[0];

  if (!revealed) {
    return (
      <ScreenShell padding="0" align="center">
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 22,
            padding: "0 30px",
            position: "relative",
          }}
        >
          <div
            style={{
              fontFamily: fonts.heading,
              fontWeight: 400,
              fontSize: 11,
              letterSpacing: "0.3em",
              color: colors.creamDim40,
              textTransform: "uppercase",
            }}
          >
            FINAL RESULT
          </div>
          <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 18, color: colors.cream, textAlign: "center" }}>
            最終順位、まもなく発表します
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {[0, 0.2, 0.4].map((delay, i) => (
              <div
                key={i}
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: colors.cream,
                  animation: `dotBlink 1.4s infinite`,
                  animationDelay: `${delay}s`,
                }}
              />
            ))}
          </div>
        </div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell padding="96px 26px 40px" align="center">
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(circle at 50% 38%, rgba(255,199,44,0.16), transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <div className="kk-pop-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, position: "relative" }}>
        <div
          style={{
            fontFamily: fonts.heading,
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "0.3em",
            color: colors.gold,
            textShadow: "0 0 14px rgba(255,199,44,0.6)",
          }}
        >
          優勝
        </div>
        <div
          style={{
            fontFamily: fonts.heading,
            fontWeight: 900,
            fontSize: 44,
            letterSpacing: "-0.02em",
            color: colors.gold,
            textAlign: "center",
            animation: "goldGlow 2.2s ease-in-out infinite",
          }}
        >
          {winner?.name ?? ""}
        </div>
        {winner && (
          <div style={{ fontFamily: fonts.mono, fontSize: 15, color: colors.gold }}>{format(winner.value)}</div>
        )}
      </div>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8, marginTop: 8, position: "relative" }}>
        <div
          style={{
            fontFamily: fonts.heading,
            fontSize: 11,
            letterSpacing: "0.15em",
            color: colors.creamDim40,
            textAlign: "center",
            marginBottom: 6,
          }}
        >
          FINAL RANKING
        </div>
        {finalResult.ranking.map((row, i) => {
          const isFirst = i === 0;
          return (
            <div
              key={row.participantId}
              className="kk-item-enter"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: isFirst ? "rgba(255,199,44,0.12)" : colors.card,
                border: isFirst ? `1px solid ${colors.goldBorder}` : "none",
                borderRadius: 12,
                padding: "12px 16px",
                animationDelay: `${200 + i * 80}ms`,
              }}
            >
              <div style={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: 16, color: isFirst ? colors.gold : colors.creamDim50, width: 18 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, fontFamily: fonts.heading, fontWeight: 700, fontSize: 15, color: isFirst ? colors.gold : colors.cream }}>
                {row.name}
              </div>
              <div style={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: 14, color: isFirst ? colors.gold : colors.creamDim70 }}>
                {format(row.value)}
              </div>
            </div>
          );
        })}
      </div>
    </ScreenShell>
  );
}
