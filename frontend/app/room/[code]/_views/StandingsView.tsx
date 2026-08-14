"use client";

import { useState } from "react";
import { LocalView, ParticipantInfo, RoundInfo } from "@/lib/types";
import { ScreenShell, ScreenHeader } from "@/components/ui/ScreenShell";
import { PillTabs } from "@/components/ui/PillTabs";
import { RankRow } from "@/components/ui/RankRow";
import { PrimaryButton, SecondaryButton } from "@/components/ui/PrimaryButton";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { RoundMode, startRound, setStandingsVisibility } from "@/lib/roundActions";
import { getSocket } from "@/lib/socket";
import { colors, fonts } from "@/lib/theme";

interface RankingRow {
  participantId: string;
  totalScore?: number;
  rankPoints?: number;
  composite?: number;
}

interface Props {
  roomCode: string;
  role: "host" | "participant";
  hostToken: string | null;
  selfParticipantId: string | null;
  participants: ParticipantInfo[];
  participantsById: Record<string, string>;
  participantsMap: Record<string, ParticipantInfo>;
  currentRound: RoundInfo | null;
  totalScoreRanking: RankingRow[];
  rankPointsRanking: RankingRow[];
  compositeRanking: RankingRow[];
  standingsVisible: boolean;
  errorMessage: string | null;
  onNavigate: (v: LocalView) => void;
}

export function StandingsView({
  roomCode,
  role,
  hostToken,
  selfParticipantId,
  participants,
  participantsById,
  participantsMap,
  totalScoreRanking,
  rankPointsRanking,
  compositeRanking,
  standingsVisible,
  errorMessage,
  onNavigate,
}: Props) {
  const [tab, setTab] = useState<"total" | "points" | "composite">("composite");
  const [starting, setStarting] = useState(false);
  const [mode, setMode] = useState<RoundMode | null>(null);

  const rows =
    tab === "total"
      ? totalScoreRanking.map((r) => ({ participantId: r.participantId, value: r.totalScore ?? 0, display: `${(r.totalScore ?? 0).toFixed(1)}点` }))
      : tab === "points"
        ? rankPointsRanking.map((r) => ({ participantId: r.participantId, value: r.rankPoints ?? 0, display: `${r.rankPoints ?? 0}P` }))
        : compositeRanking.map((r) => ({ participantId: r.participantId, value: r.composite ?? 0, display: `${(r.composite ?? 0).toFixed(1)}` }));

  const ownRow = rows.find((r) => r.participantId === selfParticipantId);

  const activeCount = participants.filter((p) => p.active).length;

  const handleNextRound = () => {
    if (!hostToken || starting) return;
    if (activeCount < 2) return;
    setStarting(true);
    startRound(roomCode, hostToken, mode, activeCount);
    setTimeout(() => setStarting(false), 1500);
  };

  const decisionMetric = tab === "total" ? "total_score" : tab === "points" ? "rank_points" : "composite";
  const metricLabel = tab === "total" ? "総得点" : tab === "points" ? "勝敗ポイント" : "総合力";

  const handleFinalize = () => {
    if (!hostToken) return;
    getSocket().emit("session:finalize", { roomCode, hostToken, decisionMetric });
  };

  const handleToggleVisibility = () => {
    if (!hostToken) return;
    setStandingsVisibility(roomCode, hostToken, !standingsVisible);
  };

  const canSeeFullRanking = standingsVisible;

  return (
    <ScreenShell padding="72px 24px 28px">
      <ScreenHeader kicker="STANDINGS" title="順位表" />

      <PillTabs
        value={tab}
        onChange={(v) => setTab(v as "total" | "points" | "composite")}
        options={[
          { value: "composite", label: "総合力" },
          { value: "total", label: "総得点" },
          { value: "points", label: "勝敗ポイント" },
        ]}
      />

      {canSeeFullRanking ? (
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
      ) : (
        <div
          className="kk-pop-in"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            padding: "36px 20px",
            background: colors.card,
            borderRadius: 14,
          }}
        >
          <div style={{ fontSize: 28 }}>🤫</div>
          <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 15, color: colors.cream, textAlign: "center" }}>
            順位は最終発表までのお楽しみ！
          </div>
          {ownRow && (
            <div style={{ fontFamily: fonts.body, fontSize: 13, color: colors.creamDim60, textAlign: "center", marginTop: 4 }}>
              あなたの現在の{metricLabel}：
              <span style={{ fontFamily: fonts.mono, color: colors.gold, fontWeight: 700 }}> {ownRow.display}</span>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.red, textAlign: "center" }}>{errorMessage}</div>
      )}

      {role === "host" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "auto" }}>
          <div
            onClick={handleToggleVisibility}
            className="kk-pressable"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: colors.creamBg06,
              border: `1px solid ${colors.creamBorder}`,
              borderRadius: 10,
              padding: "10px 14px",
              cursor: "pointer",
            }}
          >
            <span style={{ fontFamily: fonts.body, fontSize: 13, color: colors.creamDim70 }}>
              {standingsVisible ? "👀 参加者に順位を公開中" : "🤫 サプライズモード（参加者には非公開）"}
            </span>
            <div
              style={{
                width: 38,
                height: 22,
                borderRadius: 100,
                background: standingsVisible ? colors.gold : "rgba(245,241,230,0.2)",
                position: "relative",
                flexShrink: 0,
                transition: "background 0.15s ease",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 2,
                  left: standingsVisible ? 18 : 2,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: colors.bg,
                  transition: "left 0.15s ease",
                }}
              />
            </div>
          </div>

          <ModeToggle value={mode} onChange={setMode} allowTeam={activeCount !== 2} />
          <PrimaryButton onClick={handleNextRound} disabled={starting}>
            次のラウンドへ
          </PrimaryButton>
          <SecondaryButton onClick={handleFinalize}>最終発表へ（{metricLabel}で決定）</SecondaryButton>
        </div>
      ) : (
        <div style={{ width: "100%", marginTop: "auto" }}>
          <SecondaryButton onClick={() => onNavigate("round")}>🎤 ペア発表に戻る</SecondaryButton>
        </div>
      )}
    </ScreenShell>
  );
}
