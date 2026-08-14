"use client";

import { useEffect, useMemo, useState } from "react";
import { getSocket } from "@/lib/socket";
import { LocalView, ParticipantInfo, RoundInfo } from "@/lib/types";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { Avatar } from "@/components/ui/Avatar";
import { showStandingsForEveryone } from "@/lib/roundActions";
import { colors, fonts } from "@/lib/theme";

interface Props {
  roomCode: string;
  hostToken: string;
  participantsById: Record<string, string>;
  participantsMap: Record<string, ParticipantInfo>;
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

export function ScoreInputView({ roomCode, hostToken, participantsById, participantsMap, currentRound, errorMessage, onNavigate }: Props) {
  const performances = useMemo(
    () => [...currentRound.performances].sort((a, b) => a.order - b.order),
    [currentRound.performances]
  );
  const [selectedIndex, setSelectedIndex] = useState(() =>
    Math.max(0, performances.findIndex((p) => p.rawScore === null))
  );
  const [digits, setDigits] = useState("");
  const [editing, setEditing] = useState(true);

  const selected = performances[selectedIndex];

  useEffect(() => {
    const alreadyScored = selected?.rawScore != null;
    setEditing(!alreadyScored);
    setDigits("");
  }, [selectedIndex, currentRound.roundId]);

  const allConfirmed = performances.every((p) => p.rawScore !== null);

  const label = useMemo(() => {
    if (!selected) return "";
    const names = selected.memberIds.map((id) => participantsById[id] ?? "?").join(" ＆ ");
    return selected.memberIds.length === 2 ? names : `${names}（ソロ）`;
  }, [selected, participantsById]);

  const pressDigit = (d: string) => {
    if (!d || !editing) return;
    setDigits((prev) => (prev.length >= SCORE_LENGTH ? prev : prev + d));
  };

  const backspace = () => {
    if (!editing) return;
    setDigits((prev) => prev.slice(0, -1));
  };

  const confirm = () => {
    if (!selected || digits.length !== SCORE_LENGTH) return;
    const rawScore = digitsToScore(digits);
    const eventName = selected.rawScore !== null ? "score:correct" : "score:submit";
    getSocket().emit(eventName, { roomCode, hostToken, performanceId: selected.performanceId, rawScore });
    setEditing(false);

    const nextIndex = performances.findIndex((p, i) => i !== selectedIndex && p.rawScore === null);
    if (nextIndex !== -1) {
      setTimeout(() => setSelectedIndex(nextIndex), 400);
    }
  };

  const startEditing = () => {
    setDigits("");
    setEditing(true);
  };

  const complete = digits.length === SCORE_LENGTH;
  const displayDigits = editing ? digits : scoreToDigits(selected?.rawScore ?? null);
  const intDigits = displayDigits.slice(0, 2);
  const decDigits = displayDigits.slice(2, 5);

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
              {p.order}. {names} {confirmed ? "✓" : ""}
            </div>
          );
        })}
      </div>

      {selected && (
        <>
          <div style={{ background: colors.card, borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex" }}>
                {selected.memberIds.map((id, mi) => (
                  <div key={id} style={{ marginLeft: mi === 0 ? 0 : -8 }}>
                    <Avatar
                      name={participantsMap[id]?.name ?? "?"}
                      avatarType={participantsMap[id]?.avatarType}
                      avatarValue={participantsMap[id]?.avatarValue}
                      size={24}
                    />
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: fonts.heading, fontSize: 11, letterSpacing: "0.08em", color: colors.creamDim50 }}>
                {selected.order}番目 ・ {label}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
              <span
                style={{
                  fontFamily: fonts.heading,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  color: colors.creamDim50,
                  background: "rgba(245,241,230,0.1)",
                  borderRadius: 4,
                  padding: "2px 6px",
                }}
              >
                おすすめ曲
              </span>
              <span style={{ fontFamily: fonts.body, fontSize: 14, color: colors.cream }}>♪ {selected.suggestedSong.title}</span>
            </div>
          </div>

          <div
            key={`${selected.performanceId}-${editing}`}
            className={!editing ? "kk-score-flash" : undefined}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0" }}
          >
            {[0, 1].map((i) => renderSlot(intDigits[i], `int${i}`))}
            <div style={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: 28, color: "rgba(245,241,230,0.3)" }}>.</div>
            {[0, 1, 2].map((i) => renderSlot(decDigits[i], `dec${i}`))}
          </div>

          {editing ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                {DIGIT_GRID.map((label2, i) =>
                  label2 ? (
                    <div
                      key={i}
                      onClick={() => pressDigit(label2)}
                      className="kk-pressable"
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
                  className="kk-pressable"
                  style={{
                    flex: 1,
                    height: 52,
                    borderRadius: 10,
                    border: "1px solid rgba(245,241,230,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: fonts.heading,
                    fontSize: 14,
                    color: colors.creamDim70,
                    cursor: "pointer",
                  }}
                >
                  ⌫ 点数を削除
                </div>
                <div
                  onClick={complete ? confirm : undefined}
                  className={complete ? "kk-pressable" : undefined}
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
          ) : (
            <div className="kk-pop-in" style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", marginTop: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: fonts.heading, fontSize: 13, fontWeight: 700, color: colors.gold }}>
                <span className="kk-sparkle">✨</span>
                確定済み
                <span className="kk-sparkle" style={{ animationDelay: "0.3s" }}>
                  ✨
                </span>
              </div>
              <div
                onClick={startEditing}
                style={{ fontFamily: fonts.body, fontSize: 12, color: colors.creamDim60, textDecoration: "underline", cursor: "pointer" }}
              >
                得点を修正する
              </div>
            </div>
          )}
        </>
      )}

      {errorMessage && (
        <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.red, textAlign: "center" }}>{errorMessage}</div>
      )}

      {allConfirmed && (
        <div
          onClick={() => {
            showStandingsForEveryone(roomCode, hostToken);
            onNavigate("standings");
          }}
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
