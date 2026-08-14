"use client";

import { useEffect, useMemo, useState } from "react";
import { getSocket } from "@/lib/socket";
import { LocalView, RoundInfo } from "@/lib/types";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { colors, fonts } from "@/lib/theme";

interface Props {
  roomCode: string;
  hostToken: string;
  participantsById: Record<string, string>;
  currentRound: RoundInfo;
  errorMessage: string | null;
  onNavigate: (v: LocalView) => void;
}

const DIGIT_GRID = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", ""];
const SCORE_LENGTH = 5;

function scoreToDigits(score: number | null): string {
  if (score === null) return "";
  return score.toFixed(3).replace(".", "").padStart(SCORE_LENGTH, "0");
}

function digitsToScore(digits: string): number {
  const padded = digits.padEnd(SCORE_LENGTH, "0");
  return Number(`${padded.slice(0, 2)}.${padded.slice(2)}`);
}

export function ScoreInputView({ roomCode, hostToken, participantsById, currentRound, errorMessage, onNavigate }: Props) {
  const performances = currentRound.performances;
  const [selectedIndex, setSelectedIndex] = useState(() =>
    Math.max(0, performances.findIndex((p) => p.rawScore === null))
  );
  const [digits, setDigits] = useState("");
  const [justConfirmed, setJustConfirmed] = useState(false);

  const selected = performances[selectedIndex];

  useEffect(() => {
    setDigits(selected?.rawScore != null ? scoreToDigits(selected.rawScore) : "");
    setJustConfirmed(false);
  }, [selectedIndex, currentRound.roundId]);

  const allConfirmed = performances.every((p) => p.rawScore !== null);

  const label = useMemo(() => {
    if (!selected) return "";
    const names = selected.memberIds.map((id) => participantsById[id] ?? "?").join(" ＆ ");
    return selected.memberIds.length === 2 ? names : `${names}（ソロ）`;
  }, [selected, participantsById]);

  const isEditingConfirmed = selected?.rawScore !== null && !justConfirmed;

  const pressDigit = (d: string) => {
    if (!d) return;
    if (isEditingConfirmed) {
      setDigits(d);
      return;
    }
    setDigits((prev) => (prev.length >= SCORE_LENGTH ? prev : prev + d));
  };

  const backspace = () => {
    setDigits((prev) => prev.slice(0, -1));
  };

  const confirm = () => {
    if (!selected || digits.length !== SCORE_LENGTH) return;
    const rawScore = digitsToScore(digits);
    const eventName = selected.rawScore !== null ? "score:correct" : "score:submit";
    getSocket().emit(eventName, { roomCode, hostToken, performanceId: selected.performanceId, rawScore });
    setJustConfirmed(true);

    const nextIndex = performances.findIndex((p, i) => i !== selectedIndex && p.rawScore === null);
    if (nextIndex !== -1) {
      setTimeout(() => setSelectedIndex(nextIndex), 400);
    }
  };

  const complete = digits.length === SCORE_LENGTH;
  const intDigits = digits.slice(0, 2);
  const decDigits = digits.slice(2, 5);

  const renderSlot = (char: string | undefined, key: string) => {
    const lit = !!char;
    return (
      <div
        key={key}
        style={{
          width: 38,
          height: 56,
          borderRadius: 8,
          background: lit ? colors.redBg : "rgba(245,241,230,0.03)",
          border: lit ? `1px solid ${colors.redBorder}` : "1px solid rgba(245,241,230,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.mono,
          fontWeight: 700,
          fontSize: 28,
          color: lit ? colors.red : "rgba(245,241,230,0.12)",
          textShadow: lit ? "0 0 12px rgba(255,59,48,0.65),0 0 24px rgba(255,59,48,0.35)" : undefined,
        }}
      >
        {char ?? "8"}
      </div>
    );
  };

  return (
    <ScreenShell padding="70px 22px 26px">
      <div>
        <div style={{ fontFamily: fonts.heading, fontWeight: 400, fontSize: 11, letterSpacing: "0.25em", color: colors.creamDim40, textTransform: "uppercase" }}>
          SCORE INPUT
        </div>
        <div style={{ fontFamily: fonts.heading, fontWeight: 900, fontSize: 22, color: colors.cream }}>得点を入力</div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {performances.map((p, i) => {
          const names = p.memberIds.map((id) => participantsById[id] ?? "?").join("×");
          const confirmed = p.rawScore !== null;
          const active = i === selectedIndex;
          return (
            <div
              key={p.performanceId}
              onClick={() => setSelectedIndex(i)}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                fontSize: 12,
                fontFamily: fonts.body,
                cursor: "pointer",
                background: active ? colors.cream : confirmed ? "rgba(245,241,230,0.14)" : "rgba(245,241,230,0.04)",
                color: active ? colors.bg : confirmed ? colors.cream : colors.creamDim55,
                border: active ? "none" : "1px solid rgba(245,241,230,0.12)",
              }}
            >
              {names} {confirmed ? "✓" : ""}
            </div>
          );
        })}
      </div>

      {selected && (
        <>
          <div style={{ background: colors.card, borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontFamily: fonts.heading, fontSize: 11, letterSpacing: "0.08em", color: colors.creamDim50 }}>{label}</div>
            <div style={{ fontFamily: fonts.body, fontSize: 14, color: colors.cream }}>
              ♪ {selected.suggestedSong.title}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0" }}>
            {[0, 1].map((i) => renderSlot(intDigits[i], `int${i}`))}
            <div style={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: 28, color: "rgba(245,241,230,0.3)" }}>.</div>
            {[0, 1, 2].map((i) => renderSlot(decDigits[i], `dec${i}`))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {DIGIT_GRID.map((label2, i) =>
              label2 ? (
                <div
                  key={i}
                  onClick={() => pressDigit(label2)}
                  style={{
                    height: 52,
                    borderRadius: 10,
                    background: "rgba(245,241,230,0.06)",
                    border: "1px solid rgba(245,241,230,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: fonts.mono,
                    fontSize: 19,
                    color: colors.cream,
                    cursor: "pointer",
                  }}
                >
                  {label2}
                </div>
              ) : (
                <div key={i} style={{ height: 52 }} />
              )
            )}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
            <div
              onClick={backspace}
              style={{
                flex: 1,
                height: 52,
                borderRadius: 10,
                border: "1px solid rgba(245,241,230,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fonts.heading,
                fontSize: 15,
                color: colors.creamDim70,
                cursor: "pointer",
              }}
            >
              ⌫ 削除
            </div>
            <div
              onClick={complete ? confirm : undefined}
              style={{
                flex: 2,
                height: 52,
                borderRadius: 10,
                background: complete ? colors.cream : "rgba(245,241,230,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fonts.heading,
                fontWeight: 800,
                fontSize: 15,
                color: complete ? colors.bg : "rgba(245,241,230,0.3)",
                cursor: complete ? "pointer" : "default",
              }}
            >
              確定
            </div>
          </div>
        </>
      )}

      {errorMessage && (
        <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.red, textAlign: "center" }}>{errorMessage}</div>
      )}

      {allConfirmed && (
        <div
          onClick={() => onNavigate("standings")}
          style={{
            width: "100%",
            background: colors.cream,
            color: colors.bg,
            fontFamily: fonts.heading,
            fontWeight: 800,
            fontSize: 16,
            borderRadius: 12,
            padding: 17,
            textAlign: "center",
            boxSizing: "border-box",
            cursor: "pointer",
          }}
        >
          順位表を見る
        </div>
      )}
    </ScreenShell>
  );
}
