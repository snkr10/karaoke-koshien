import type { Metadata } from "next";
import { GOOGLE_FONTS_HREF } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "カラオケ甲子園",
  description: "友人・家族対抗のカラオケ勝負をリアルタイムに記録・演出するアプリ",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href={GOOGLE_FONTS_HREF} rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
