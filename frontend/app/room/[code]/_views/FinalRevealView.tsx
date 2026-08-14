"use client";

import { useEffect, useState } from "react";
import { FinalResult, ParticipantInfo } from "@/lib/types";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { Confetti } from "@/components/ui/Confetti";
import { Avatar } from "@/components/ui/Avatar";
import { colors, fonts } from "@/lib/theme";

const WAIT_MS = 2800;
const TENSION_MS = 1600;
const FLASH_MS = 350;

export function FinalRevealView({
  finalResult,
  participantsMap,
}: {
  finalResult: FinalResult;
  participantsMap: Record<string, ParticipantInfo>;
}) {
  const [revealed, setRevealed] = useState(false);
  const [tense, setTense] = useState(false);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    const tensionTimer = setTimeout(() => setTense(true), TENSION_MS);
    const flashTimer = setTimeout(() => setFlashing(true), WAIT_MS);
    const revealTimer = setTimeout(() => setRevealed(true), WAIT_MS + FLASH_MS);
    return () => {
      clearTimeout(tensionTimer);
      clearTimeout(flashTimer);
      clearTimeout(revealTimer);
    };
  }, []);

  const format = (value: number) => (finalResult.metric === "total_score" ? `${value.toFixed(1)}点` : `${value}P`);
  const winner = finalResult.ranking[0];

  if (!revealed) {
    return (
      <ScreenShell padding="0" align="center">
        {flashing && <div className="kk-screen-flash" style={{ position: "fixed", inset: 0, background: colors.gold, zIndex: 50 }} />}
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
          <div style={{ position: "relative", width: 120, height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div
              className={`kk-tension-ring ${tense ? "kk-tension-ring--fast" : ""}`}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: `2px solid ${colors.goldBorder}`,
              }}
            />
            <div
              className={`kk-tension-ring ${tense ? "kk-tension-ring--fast" : ""}`}
              style={{
                position: "absolute",
                inset: 16,
                borderRadius: "50%",
                border: `2px solid ${colors.goldBorder}`,
                animationDelay: "0.25s",
              }}
            />
            <div style={{ fontSize: 46 }} className={tense ? "kk-drum-shake" : ""}>
              🥁
            </div>
          </div>
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
                  animationName: "dotBlink",
                  animationDuration: `${tense ? 0.7 : 1.4}s`,
                  animationIterationCount: "infinite",
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
      <Confetti />
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(circle at 50% 38%, rgba(255,199,44,0.16), transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <div
        className="kk-spotlight-sweep"
        style={{
          position: "fixed",
          top: "10%",
          left: "50%",
          width: 500,
          height: 500,
          marginLeft: -250,
          background:
            "conic-gradient(from 0deg, transparent 0deg, rgba(255,199,44,0.16) 20deg, transparent 60deg, transparent 180deg, rgba(255,199,44,0.12) 210deg, transparent 250deg, transparent 360deg)",
          pointerEvents: "none",
        }}
      />
      <div className="kk-pop-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="kk-flag-wave" style={{ fontSize: 20 }}>
            🚩
          </span>
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
          <span className="kk-flag-wave" style={{ fontSize: 20, display: "inline-block", transform: "scaleX(-1)" }}>
            🚩
          </span>
        </div>
        {winner && (
          <Avatar
            name={winner.name}
            avatarType={participantsMap[winner.participantId]?.avatarType}
            avatarValue={participantsMap[winner.participantId]?.avatarValue}
            size={72}
          />
        )}
        <div
          className="kk-gold-pulse"
          style={{
            fontFamily: fonts.heading,
            fontWeight: 900,
            fontSize: 44,
            letterSpacing: "-0.02em",
            color: colors.gold,
            textAlign: "center",
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
              <Avatar
                name={row.name}
                avatarType={participantsMap[row.participantId]?.avatarType}
                avatarValue={participantsMap[row.participantId]?.avatarValue}
                size={28}
              />
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
