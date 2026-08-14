"use client";

import { useRouter } from "next/navigation";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton, SecondaryButton } from "@/components/ui/PrimaryButton";
import { colors, fonts } from "@/lib/theme";

export default function LandingPage() {
  const router = useRouter();

  return (
    <ScreenShell padding="120px 28px 40px" align="center">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 40 }}>
        <div
          style={{
            fontFamily: fonts.heading,
            fontSize: 11,
            letterSpacing: "0.25em",
            color: colors.creamDim40,
            textTransform: "uppercase",
          }}
        >
          KARAOKE KOSHIEN
        </div>
        <div style={{ fontFamily: fonts.heading, fontWeight: 900, fontSize: 34, color: colors.cream, textAlign: "center" }}>
          カラオケ甲子園
        </div>
        <div style={{ fontFamily: fonts.body, fontSize: 13, color: colors.creamDim55, textAlign: "center", marginTop: 4, lineHeight: 1.6 }}>
          友人・家族対抗のカラオケ勝負を
          <br />
          リアルタイムに記録・演出
        </div>
      </div>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
        <PrimaryButton onClick={() => router.push("/host")}>ホストとして始める</PrimaryButton>
        <SecondaryButton onClick={() => router.push("/join")}>ルームコードで参加する</SecondaryButton>
      </div>
    </ScreenShell>
  );
}
