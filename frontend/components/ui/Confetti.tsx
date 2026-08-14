"use client";

import { useMemo } from "react";
import { colors } from "@/lib/theme";

const PIECE_COLORS = [colors.gold, colors.cream, colors.red, "#FFFFFF", "#8FBF9F"];

interface Piece {
  left: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  drift: number;
  spin: number;
  round: boolean;
}

// 甲子園の紙吹雪演出。純CSSアニメーションのみで、外部ライブラリ・画像なしで実装
export function Confetti({ count = 60 }: { count?: number }) {
  const pieces = useMemo<Piece[]>(() => {
    return Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      size: 6 + Math.random() * 8,
      color: PIECE_COLORS[Math.floor(Math.random() * PIECE_COLORS.length)],
      duration: 2.6 + Math.random() * 2.2,
      delay: Math.random() * 2.5,
      drift: (Math.random() - 0.5) * 160,
      spin: 360 + Math.random() * 720 * (Math.random() < 0.5 ? -1 : 1),
      round: Math.random() < 0.5,
    }));
  }, [count]);

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 40 }}>
      {pieces.map((p, i) => (
        <div
          key={i}
          className="kk-confetti-piece"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size * (p.round ? 1 : 1.6),
              background: p.color,
              borderRadius: p.round ? "50%" : 2,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              "--kk-drift": `${p.drift}px`,
              "--kk-spin": `${p.spin}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
