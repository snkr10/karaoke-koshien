"use client";

import { useState } from "react";
import { LocalView, ParticipantInfo, RoundInfo } from "@/lib/types";
import { ScreenShell, ScreenHeader } from "@/components/ui/ScreenShell";
import { PillTabs } from "@/components/ui/PillTabs";
import { RankRow } from "@/components/ui/RankRow";
import { PrimaryButton, SecondaryButton } from "@/components/ui/PrimaryButton";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { RoundMode, startRound } from "@/lib/roundActions";
import { getSocket } from "@/lib/socket";
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
  participantsMap: Record<string, ParticipantInfo>;
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
  participantsMap,
  totalScoreRanking,
  rankPointsRanking,
  errorMessage,
  onNavigate,
}: Props) {
  const [tab, setTab] = useState<"total" | "points">("total");
  const [starting, setStarting] = useState(false);
  const [mode, setMode] = useState<RoundMode | null>(null);

  const rows =
    tab === "total"
      ? totalScoreRanking.map((r) => ({ participantId: r.participantId, value: r.totalScore ?? 0, display: `${(r.totalScore ?? 0).toFixed(1)}点` }))
      : rankPointsRanking.map((r) => ({ participantId: r.participantId, value: r.rankPoints ?? 0, display: `${r.rankPoints ?? 0}P` }));

  const handleNextRound = () => {
    if (!hostToken || starting) return;
    const activeCount = participants.filter((p) => p.active).length;
    if (activeCount < 2) return;
    setStarting(true);
    startRound(roomCode, hostToken, mode);
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
            index={i}
            avatarType={participantsMap[row.participantId]?.avatarType}
            avatarValue={participantsMap[row.participantId]?.avatarValue}
          />
        ))}
      </div>

      {errorMessage && (
        <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.red, textAlign: "center" }}>{errorMessage}</div>
      )}

      {role === "host" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "auto" }}>
          <ModeToggle value={mode} onChange={setMode} />
          <PrimaryButton onClick={handleNextRound} disabled={starting}>
            次のラウンドへ
          </PrimaryButton>
          <SecondaryButton onClick={handleFinalize}>最終発表へ（{tab === "total" ? "総得点" : "勝敗ポイント"}で決定）</SecondaryButton>
        </div>
      ) : (
        <div style={{ width: "100%", marginTop: "auto" }}>
          <SecondaryButton onClick={() => onNavigate("round")}>🎤 ペア発表に戻る</SecondaryButton>
        </div>
      )}
    </ScreenShell>
  );
}
