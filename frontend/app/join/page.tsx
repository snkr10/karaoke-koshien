"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { saveParticipantRecord } from "@/lib/storage";
import { ScreenShell, ScreenHeader } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { colors, fonts } from "@/lib/theme";

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [roomCode, setRoomCode] = useState(searchParams.get("code")?.toUpperCase() ?? "");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const onJoined = (payload: { participantId: string; sessionId: string }) => {
      saveParticipantRecord({ roomCode: roomCode.toUpperCase(), participantId: payload.participantId, name });
      router.push(`/room/${roomCode.toUpperCase()}`);
    };
    const onError = (payload: { code: string; message: string }) => {
      setSubmitting(false);
      setError(payload.message);
    };

    socket.on("participant:joined", onJoined);
    socket.on("error", onError);
    return () => {
      socket.off("participant:joined", onJoined);
      socket.off("error", onError);
    };
  }, [roomCode, name, router]);

  const handleSubmit = () => {
    if (!roomCode.trim() || !name.trim() || submitting) return;
    setError(null);
    setSubmitting(true);
    getSocket().emit("participant:join", { roomCode: roomCode.trim().toUpperCase(), name: name.trim() });
  };

  return (
    <ScreenShell padding="76px 28px 40px" align="center">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginTop: 12 }}>
        <div style={{ fontFamily: fonts.heading, fontSize: 11, letterSpacing: "0.25em", color: colors.creamDim40, textTransform: "uppercase" }}>
          KARAOKE KOSHIEN
        </div>
        <div style={{ fontFamily: fonts.heading, fontWeight: 900, fontSize: 30, color: colors.cream, textAlign: "center" }}>
          カラオケ甲子園
        </div>
        <div style={{ fontFamily: fonts.body, fontSize: 13, color: colors.creamDim55, textAlign: "center", marginTop: 4 }}>
          友人・家族対抗のカラオケ勝負に参加しよう
        </div>
      </div>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontFamily: fonts.heading, fontSize: 12, letterSpacing: "0.1em", color: colors.creamDim50 }}>
            ルームコード
          </div>
          <input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="K7X9QZ"
            maxLength={6}
            style={{
              background: colors.creamBg06,
              border: `1px solid ${colors.creamBorder}`,
              borderRadius: 10,
              padding: 16,
              fontFamily: fonts.mono,
              fontSize: 22,
              letterSpacing: 8,
              color: colors.cream,
              textAlign: "center",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontFamily: fonts.heading, fontSize: 12, letterSpacing: "0.1em", color: colors.creamDim50 }}>
            ニックネーム
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='たとえば「たくみ」'
            style={{
              background: colors.creamBg06,
              border: `1px solid ${colors.creamBorder}`,
              borderRadius: 10,
              padding: "15px 16px",
              fontFamily: fonts.body,
              fontSize: 16,
              color: colors.cream,
              boxSizing: "border-box",
              outline: "none",
            }}
          />
        </div>
      </div>

      <PrimaryButton onClick={handleSubmit} disabled={submitting}>
        参加する
      </PrimaryButton>

      {error && (
        <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.red, textAlign: "center" }}>{error}</div>
      )}

      <div style={{ fontFamily: fonts.body, fontSize: 11, color: colors.creamDim35, textAlign: "center" }}>
        主催者からもらったルームコードを入力してください
      </div>
    </ScreenShell>
  );
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinForm />
    </Suspense>
  );
}
