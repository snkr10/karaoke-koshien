"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSession } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { saveHostRecord, setSessionRole } from "@/lib/storage";
import { AvatarValue } from "@/lib/avatar";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { AvatarPicker } from "@/components/ui/AvatarPicker";
import { colors, fonts } from "@/lib/theme";

export default function HostCreatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<AvatarValue | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();
    const onError = (payload: { code: string; message: string }) => {
      setCreating(false);
      setError(payload.message);
    };
    socket.on("error", onError);
    return () => {
      socket.off("error", onError);
    };
  }, []);

  const handleStart = async () => {
    if (!name.trim() || creating) return;
    setCreating(true);
    setError(null);
    try {
      const { sessionId, roomCode, hostToken } = await createSession();
      const socket = getSocket();

      const onJoined = (payload: { participantId: string }) => {
        saveHostRecord({ sessionId, roomCode, hostToken, participantId: payload.participantId, name: name.trim() });
        setSessionRole(roomCode, "host");
        socket.off("participant:joined", onJoined);
        router.replace(`/room/${roomCode}`);
      };
      socket.on("participant:joined", onJoined);
      socket.emit("participant:join", {
        roomCode,
        name: name.trim(),
        avatarType: avatar?.avatarType,
        avatarValue: avatar?.avatarValue,
      });
    } catch {
      setError("ルームの作成に失敗しました。時間をおいて再度お試しください。");
      setCreating(false);
    }
  };

  return (
    <ScreenShell padding="76px 28px 40px" align="center">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginTop: 12 }}>
        <div
          style={{
            fontFamily: fonts.heading,
            fontSize: 11,
            letterSpacing: "0.25em",
            color: colors.creamDim40,
            textTransform: "uppercase",
          }}
        >
          HOST
        </div>
        <div style={{ fontFamily: fonts.heading, fontWeight: 900, fontSize: 30, color: colors.cream, textAlign: "center" }}>
          ルームを作成
        </div>
        <div style={{ fontFamily: fonts.body, fontSize: 13, color: colors.creamDim55, textAlign: "center", marginTop: 4 }}>
          あなたもプレイヤーとして参加できます
        </div>
      </div>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontFamily: fonts.heading, fontSize: 12, letterSpacing: "0.1em", color: colors.creamDim50 }}>
            ニックネーム
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='たとえば「たんたん」'
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

        <AvatarPicker name={name} value={avatar} onChange={setAvatar} />
      </div>

      <PrimaryButton onClick={handleStart} disabled={!name.trim() || creating}>
        {creating ? "ルームを作成しています..." : "ルームを作成する"}
      </PrimaryButton>

      {error && (
        <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.red, textAlign: "center" }}>{error}</div>
      )}
    </ScreenShell>
  );
}
