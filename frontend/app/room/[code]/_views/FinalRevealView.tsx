"use client";

import { useEffect, useState } from "react";
import { FinalResult, ParticipantInfo } from "@/lib/types";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { Confetti } from "@/components/ui/Confetti";
import { Avatar } from "@/components/ui/Avatar";
import { BarRace } from "@/components/ui/BarRace";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { restartSession } from "@/lib/roundActions";
import { colors, fonts } from "@/lib/theme";

const WAIT_MS = 2800;
const TENSION_MS = 1600;
const FLASH_MS = 350;

export function FinalRevealView({
  finalResult,
  participantsMap,
  role,
  roomCode,
  hostToken,
}: {
  finalResult: FinalResult;
  participantsMap: Record<string, ParticipantInfo>;
  role: "host" | "participant";
  roomCode: string;
  hostToken: string | null;
}) {
  const [revealed, setRevealed] = useState(false);
  const [tense, setTense] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const [raceDone, setRaceDone] = useState(false);

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

  const format = (value: number) =>
    finalResult.metric === "total_score"
      ? `${value.toFixed(1)}点`
      : finalResult.metric === "rank_points"
        ? `${value}P`
        : value.toFixed(1);
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
    <ScreenShell padding="80px 26px 40px" align="center">
      {raceDone && <Confetti />}
      {raceDone && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "radial-gradient(circle at 50% 38%, rgba(255,199,44,0.16), transparent 60%)",
            pointerEvents: "none",
          }}
        />
      )}
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

      <div style={{ width: "100%", marginTop: 24 }}>
        <BarRace entries={finalResult.ranking.map((r) => ({ ...r, ...participantsMap[r.participantId] }))} format={format} onComplete={() => setRaceDone(true)} />
      </div>

      {raceDone && winner && (
        <div className="kk-pop-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, position: "relative", marginTop: 32 }}>
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
          <Avatar
            name={winner.name}
            avatarType={participantsMap[winner.participantId]?.avatarType}
            avatarValue={participantsMap[winner.participantId]?.avatarValue}
            size={72}
          />
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
            {winner.name}
          </div>
          <div style={{ fontFamily: fonts.mono, fontSize: 15, color: colors.gold }}>{format(winner.value)}</div>
        </div>
      )}

      {raceDone && role === "host" && hostToken && (
        <div className="kk-pop-in" style={{ width: "100%", marginTop: 40, position: "relative" }}>
          <PrimaryButton onClick={() => restartSession(roomCode, hostToken)}>🔄 もう一度対戦する</PrimaryButton>
        </div>
      )}
    </ScreenShell>
  );
}
