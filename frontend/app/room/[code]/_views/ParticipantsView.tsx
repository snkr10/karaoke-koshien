"use client";

import { useState } from "react";
import { getSocket } from "@/lib/socket";
import { LocalView, ParticipantInfo, RoundInfo } from "@/lib/types";
import { ScreenShell, ScreenHeader } from "@/components/ui/ScreenShell";
import { Card } from "@/components/ui/Card";
import { PrimaryButton, SecondaryButton } from "@/components/ui/PrimaryButton";
import { QRCodeBox } from "@/components/ui/QRCode";
import { Avatar } from "@/components/ui/Avatar";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { RoundMode, startRound, showStandingsForEveryone } from "@/lib/roundActions";
import { colors, fonts } from "@/lib/theme";

interface Props {
  roomCode: string;
  role: "host" | "participant";
  hostToken: string | null;
  participants: ParticipantInfo[];
  currentRound: RoundInfo | null;
  errorMessage: string | null;
  onNavigate: (v: LocalView) => void;
}

export function ParticipantsView({ roomCode, role, hostToken, participants, currentRound, errorMessage, onNavigate }: Props) {
  const [starting, setStarting] = useState(false);
  const [mode, setMode] = useState<RoundMode | null>(null);
  const activeParticipants = participants.filter((p) => p.active);

  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}/join?code=${roomCode}` : "";

  const handleRemove = (participantId: string) => {
    if (!hostToken) return;
    getSocket().emit("participant:remove", { roomCode, hostToken, participantId });
  };

  const handleStart = () => {
    if (!hostToken || activeParticipants.length < 2 || starting) return;
    setStarting(true);
    startRound(roomCode, hostToken, mode, activeParticipants.length);
    setTimeout(() => setStarting(false), 1500);
  };

  const handleShowStandings = () => {
    if (hostToken) showStandingsForEveryone(roomCode, hostToken);
    onNavigate("standings");
  };

  if (role === "host") {
    return (
      <ScreenShell padding="72px 24px 28px">
        <ScreenHeader kicker="HOST" title="参加者を管理" />

        <Card style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontFamily: fonts.heading, fontSize: 11, letterSpacing: "0.1em", color: colors.creamDim50 }}>
              ルームコード
            </div>
            <div style={{ fontFamily: fonts.mono, fontSize: 26, letterSpacing: 6, color: colors.cream, fontWeight: 700 }}>
              {roomCode}
            </div>
          </div>
          <QRCodeBox value={joinUrl} />
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minHeight: 0 }}>
          <div style={{ fontFamily: fonts.heading, fontSize: 12, letterSpacing: "0.1em", color: colors.creamDim50 }}>
            参加者（{activeParticipants.length}人）
          </div>
          <div style={{ background: colors.card, borderRadius: 14, overflow: "hidden" }}>
            {activeParticipants.length === 0 && (
              <div style={{ padding: 20, textAlign: "center", fontFamily: fonts.body, fontSize: 13, color: colors.creamDim55 }}>
                参加者がまだいません。ルームコードを共有しましょう。
              </div>
            )}
            {activeParticipants.map((p, i) => (
              <div
                key={p.participantId}
                className="kk-item-enter"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  borderBottom: i < activeParticipants.length - 1 ? "1px solid rgba(245,241,230,0.1)" : "none",
                  animationDelay: `${i * 50}ms`,
                }}
              >
                <Avatar name={p.name} avatarType={p.avatarType} avatarValue={p.avatarValue} size={34} />
                <div style={{ flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.cream }}>{p.name}</div>
                <div
                  onClick={() => handleRemove(p.participantId)}
                  className="kk-pressable"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    border: "1px solid rgba(245,241,230,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    color: colors.creamDim55,
                    flexShrink: 0,
                    cursor: "pointer",
                  }}
                >
                  ×
                </div>
              </div>
            ))}
          </div>
        </div>

        {errorMessage && (
          <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.red, textAlign: "center" }}>{errorMessage}</div>
        )}

        {currentRound && <SecondaryButton onClick={handleShowStandings}>📊 順位表を見る</SecondaryButton>}

        <ModeToggle value={mode} onChange={setMode} allowTeam={activeParticipants.length !== 2} />

        <PrimaryButton onClick={handleStart} disabled={activeParticipants.length < 2 || starting}>
          ラウンドを開始する
        </PrimaryButton>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell padding="72px 24px 28px">
      <ScreenHeader kicker="WAITING" title="ホストの開始を待っています" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minHeight: 0 }}>
        <div style={{ fontFamily: fonts.heading, fontSize: 12, letterSpacing: "0.1em", color: colors.creamDim50 }}>
          参加者（{activeParticipants.length}人）
        </div>
        <div style={{ background: colors.card, borderRadius: 14, overflow: "hidden" }}>
          {activeParticipants.map((p, i) => (
            <div
              key={p.participantId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                borderBottom: i < activeParticipants.length - 1 ? "1px solid rgba(245,241,230,0.1)" : "none",
              }}
            >
              <Avatar name={p.name} avatarType={p.avatarType} avatarValue={p.avatarValue} size={34} />
              <div style={{ flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.cream }}>{p.name}</div>
            </div>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
}
