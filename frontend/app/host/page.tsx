"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSession } from "@/lib/api";
import { saveHostRecord } from "@/lib/storage";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { colors, fonts } from "@/lib/theme";

export default function HostCreatePage() {
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    createSession()
      .then(({ sessionId, roomCode, hostToken }) => {
        saveHostRecord({ sessionId, roomCode, hostToken });
        router.replace(`/room/${roomCode}`);
      })
      .catch(() => setError("ルームの作成に失敗しました。時間をおいて再度お試しください。"));
  }, [router]);

  return (
    <ScreenShell padding="0" align="center">
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <div style={{ fontFamily: fonts.heading, fontSize: 15, color: colors.cream }}>
          {error ?? "ルームを作成しています..."}
        </div>
      </div>
    </ScreenShell>
  );
}
