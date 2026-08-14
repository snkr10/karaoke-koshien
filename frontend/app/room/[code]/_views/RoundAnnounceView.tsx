"use client";

import { getSocket } from "@/lib/socket";
import { LocalView, RoundInfo } from "@/lib/types";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { Card } from "@/components/ui/Card";
import { PrimaryButton, SecondaryButton } from "@/components/ui/PrimaryButton";
import { colors, fonts } from "@/lib/theme";

interface Props {
  roomCode: string;
  role: "host" | "participant";
  hostToken: string | null;
  participantsById: Record<string, string>;
  currentRound: RoundInfo;
  errorMessage: string | null;
  onNavigate: (v: LocalView) => void;
}

const TEAM_LABELS = ["チームA", "チームB", "チームC", "チームD", "チームE", "チームF"];

export function RoundAnnounceView({ roomCode, role, hostToken, participantsById, currentRound, errorMessage, onNavigate }: Props) {
  const handleReshuffle = () => {
    if (!hostToken) return;
    getSocket().emit("round:reshuffle_pairs", { roomCode, hostToken, roundId: currentRound.roundId });
  };

  return (
    <ScreenShell padding="72px 24px 32px" align="center">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ fontFamily: fonts.heading, fontWeight: 400, fontSize: 11, letterSpacing: "0.25em", color: colors.creamDim40, textTransform: "uppercase" }}>
          ROUND
        </div>
        <div style={{ fontFamily: fonts.heading, fontWeight: 900, fontSize: 56, letterSpacing: "-0.02em", color: colors.cream, lineHeight: 1 }}>
          {String(currentRound.roundNumber).padStart(2, "0")}
        </div>
        <div
          style={{
            marginTop: 6,
            padding: "7px 18px",
            border: "1px solid rgba(245,241,230,0.3)",
            borderRadius: 100,
            fontFamily: fonts.heading,
            fontSize: 12,
            letterSpacing: "0.08em",
            color: colors.cream,
          }}
        >
          {currentRound.mode === "team" ? "チーム戦（デュエット）" : "個人戦"}
        </div>
      </div>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
        {(() => {
          let teamIndex = -1;
          return currentRound.performances.map((perf) => {
            const names = perf.memberIds.map((id) => participantsById[id] ?? "?").join(" ＆ ");
            if (perf.memberIds.length === 2) teamIndex++;
            const label = perf.memberIds.length === 2 ? TEAM_LABELS[teamIndex] ?? `チーム${teamIndex + 1}` : `${names}（ソロ）`;
            return (
            <Card key={perf.performanceId}>
              <div style={{ fontFamily: fonts.heading, fontSize: 11, letterSpacing: "0.1em", color: colors.creamDim50 }}>
                {label}
              </div>
              <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 19, color: colors.cream }}>
                {perf.memberIds.length === 2 ? names : " "}
              </div>
              <div style={{ fontFamily: fonts.body, fontSize: 14, color: colors.creamDim60 }}>
                ♪ {perf.suggestedSong.title}
                {perf.suggestedSong.artist ? ` / ${perf.suggestedSong.artist}` : ""}
              </div>
              </Card>
            );
          });
        })()}
      </div>

      {errorMessage && (
        <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.red, textAlign: "center" }}>{errorMessage}</div>
      )}

      {role === "host" ? (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10, marginTop: "auto" }}>
          {currentRound.mode === "team" && <SecondaryButton onClick={handleReshuffle}>ペアを組み直す</SecondaryButton>}
          <PrimaryButton onClick={() => onNavigate("score")}>得点入力へ</PrimaryButton>
        </div>
      ) : (
        <div
          onClick={() => onNavigate("standings")}
          style={{ marginTop: "auto", fontFamily: fonts.body, fontSize: 12, color: colors.creamDim60, textAlign: "center", textDecoration: "underline", cursor: "pointer" }}
        >
          順位表を見る
        </div>
      )}
    </ScreenShell>
  );
}
