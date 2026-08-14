"use client";

import { useState } from "react";
import { getSocket } from "@/lib/socket";
import { LocalView, ParticipantInfo, RoundInfo } from "@/lib/types";
import { ScreenShell, ScreenHeader } from "@/components/ui/ScreenShell";
import { PillTabs } from "@/components/ui/PillTabs";
import { RankRow } from "@/components/ui/RankRow";
import { PrimaryButton, SecondaryButton } from "@/components/ui/PrimaryButton";
import { colors, fonts } from "@/lib/theme";

interface RankingRow {
  participantId: string;
  totalScore?: number;
  rankPoints?: number;
}

interface Props {
  roomCode: string;
  role: "host" | "participant";
  hostToken: string | null;
  participants: ParticipantInfo[];
  participantsById: Record<string, string>;
  currentRound: RoundInfo | null;
  totalScoreRanking: RankingRow[];
  rankPointsRanking: RankingRow[];
  errorMessage: string | null;
  onNavigate: (v: LocalView) => void;
}

export function StandingsView({
  roomCode,
  role,
  hostToken,
  participants,
  participantsById,
  totalScoreRanking,
  rankPointsRanking,
  errorMessage,
  onNavigate,
}: Props) {
  const [tab, setTab] = useState<"total" | "points">("total");
  const [starting, setStarting] = useState(false);

  const rows =
    tab === "total"
      ? totalScoreRanking.map((r) => ({ participantId: r.participantId, value: r.totalScore ?? 0, display: `${(r.totalScore ?? 0).toFixed(1)}点` }))
      : rankPointsRanking.map((r) => ({ participantId: r.participantId, value: r.rankPoints ?? 0, display: `${r.rankPoints ?? 0}P` }));

  const handleNextRound = () => {
    if (!hostToken || starting) return;
    const activeCount = participants.filter((p) => p.active).length;
    if (activeCount < 2) return;
    setStarting(true);
    const mode = Math.random() < 0.5 ? "individual" : "team";
    getSocket().emit("round:start", { roomCode, hostToken, mode });
    setTimeout(() => setStarting(false), 1500);
  };

  const handleFinalize = () => {
    if (!hostToken) return;
    const decisionMetric = tab === "total" ? "total_score" : "rank_points";
    getSocket().emit("session:finalize", { roomCode, hostToken, decisionMetric });
  };

  return (
    <ScreenShell padding="72px 24px 28px">
      <ScreenHeader kicker="STANDINGS" title="順位表" />

      <PillTabs
        value={tab}
        onChange={(v) => setTab(v as "total" | "points")}
        options={[
          { value: "total", label: "総得点" },
          { value: "points", label: "勝敗ポイント" },
        ]}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.length === 0 && (
          <div style={{ fontFamily: fonts.body, fontSize: 13, color: colors.creamDim55, textAlign: "center", padding: 20 }}>
            まだ結果がありません
          </div>
        )}
        {rows.map((row, i) => (
          <RankRow
            key={row.participantId}
            rank={i + 1}
            name={participantsById[row.participantId] ?? "?"}
            display={row.display}
            isFirst={i === 0}
          />
        ))}
      </div>

      {errorMessage && (
        <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.red, textAlign: "center" }}>{errorMessage}</div>
      )}

      {role === "host" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "auto" }}>
          <PrimaryButton onClick={handleNextRound} disabled={starting}>
            次のラウンドへ
          </PrimaryButton>
          <SecondaryButton onClick={handleFinalize}>最終発表へ（{tab === "total" ? "総得点" : "勝敗ポイント"}で決定）</SecondaryButton>
        </div>
      ) : (
        <div
          onClick={() => onNavigate("round")}
          style={{ marginTop: "auto", fontFamily: fonts.body, fontSize: 12, color: colors.creamDim60, textAlign: "center", textDecoration: "underline", cursor: "pointer" }}
        >
          ペア発表に戻る
        </div>
      )}
    </ScreenShell>
  );
}
