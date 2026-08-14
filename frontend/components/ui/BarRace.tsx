"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { colors, fonts } from "@/lib/theme";

export interface RaceEntry {
  participantId: string;
  name: string;
  value: number;
  avatarType?: string | null;
  avatarValue?: string | null;
}

interface AnimMeta {
  amplitude: number;
  freq: number;
  phase: number;
}

const DURATION_MS = 4200;
const ROW_HEIGHT = 60;
const ROW_GAP = 10;

// 「じわじわ伸びる→中盤でリードチェンジが多発→終盤で一瞬もつれて溜める→最後にスパート」
// という流れを作る全体の進行カーブ。t=1でちょうど1.0に到達する
function raceEase(t: number): number {
  if (t < 0.6) {
    // 序盤〜中盤: やや速めに伸びるが、まだ最終値の75%までしか進まない
    const local = t / 0.6;
    return (1 - Math.pow(1 - local, 2)) * 0.75;
  }
  // 終盤: 一度伸びが鈍って溜めを作ってから、最後にスパートする
  const local = (t - 0.6) / 0.4;
  const holdThenSurge = local < 0.55 ? local * 0.25 : 0.1375 + (local - 0.55) * (0.8625 / 0.45);
  return 0.75 + Math.min(1, holdThenSurge) * 0.25;
}

// 揺らぎの強さ: 序盤・終盤は控えめ、中盤（リードチェンジの見せ場）でピークになる
function wobbleEnvelope(t: number): number {
  return Math.sin(Math.PI * Math.min(1, t / 0.92));
}

// 横棒グラフレース演出。最終値には正しく収束しつつ、演出用にランダムな揺らぎを与えて
// 途中経過で順位が入れ替わっているように見せる（実データではなく演出目的のアニメーション）。
// 表示値は絶対に後退させない（前フレームの値とのmaxを取る）ことで、バーが縮んで見える
// 不自然さを防ぎつつ、伸びが一瞬止まる「溜め」の演出だけは違和感なく成立させている
export function BarRace({
  entries,
  format,
  onComplete,
}: {
  entries: RaceEntry[];
  format: (v: number) => string;
  onComplete?: () => void;
}) {
  const maxValue = Math.max(1, ...entries.map((e) => e.value));

  const metaRef = useRef<Record<string, AnimMeta>>(
    Object.fromEntries(
      entries.map((e) => [
        e.participantId,
        { amplitude: 0.18 + Math.random() * 0.22, freq: 1.6 + Math.random() * 2, phase: Math.random() * Math.PI * 2 },
      ])
    )
  );

  // 上位2人（最終値ベース）は、終盤でわざと僅差に見せてから最後に決着させる
  const topTwoRef = useRef<[string, string] | null>(
    (() => {
      const sorted = [...entries].sort((a, b) => b.value - a.value);
      return sorted.length >= 2 ? [sorted[0].participantId, sorted[1].participantId] : null;
    })()
  );

  const maxSoFarRef = useRef<Record<string, number>>(
    Object.fromEntries(entries.map((e) => [e.participantId, 0]))
  );

  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(entries.map((e) => [e.participantId, 0]))
  );
  const [ranks, setRanks] = useState<Record<string, number>>(() =>
    Object.fromEntries(entries.map((e, i) => [e.participantId, i]))
  );
  const [leadTense, setLeadTense] = useState(false);

  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    let done = false;

    const step = (ts: number) => {
      if (start === null) start = ts;
      const elapsed = ts - start;
      const t = Math.min(1, elapsed / DURATION_MS);
      const eased = raceEase(t);
      const envelope = wobbleEnvelope(t);

      const nextValues: Record<string, number> = {};
      for (const e of entries) {
        const meta = metaRef.current[e.participantId];
        let candidate: number;
        if (t >= 1) {
          candidate = e.value;
        } else {
          const wobble = meta.amplitude * Math.sin(t * Math.PI * meta.freq + meta.phase) * envelope;
          const factor = Math.max(0, eased + wobble);
          candidate = e.value * factor;

          // 終盤の「もつれ」演出: 上位2人だけ、決着直前まで僅差の帯に抑え込む
          if (topTwoRef.current && topTwoRef.current.includes(e.participantId) && t > 0.82 && t < 0.97) {
            const loserFinal = Math.min(
              entries.find((x) => x.participantId === topTwoRef.current![0])!.value,
              entries.find((x) => x.participantId === topTwoRef.current![1])!.value
            );
            candidate = Math.min(candidate, loserFinal * 0.95);
          }
        }
        const clamped = Math.max(candidate, maxSoFarRef.current[e.participantId] ?? 0);
        maxSoFarRef.current[e.participantId] = clamped;
        nextValues[e.participantId] = clamped;
      }
      setValues(nextValues);

      const sorted = [...entries].sort((a, b) => nextValues[b.participantId] - nextValues[a.participantId]);
      setRanks(Object.fromEntries(sorted.map((e, i) => [e.participantId, i])));
      setLeadTense(t > 0.82 && t < 0.97);

      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else if (!done) {
        done = true;
        onComplete?.();
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const containerHeight = entries.length * ROW_HEIGHT + Math.max(0, entries.length - 1) * ROW_GAP;

  return (
    <div style={{ width: "100%", position: "relative", height: containerHeight }}>
      {entries.map((e) => {
        const value = values[e.participantId] ?? 0;
        const rank = ranks[e.participantId] ?? 0;
        const widthPct = Math.max(6, (value / maxValue) * 100);
        const isFirst = rank === 0;
        const isTenseContender = leadTense && (rank === 0 || rank === 1);
        return (
          <div
            key={e.participantId}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: ROW_HEIGHT,
              transform: `translateY(${rank * (ROW_HEIGHT + ROW_GAP)}px)`,
            }}
          >
            <div
              className={isTenseContender ? "kk-bar-row-shake" : undefined}
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Avatar name={e.name} avatarType={e.avatarType} avatarValue={e.avatarValue} size={30} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span
                    style={{
                      fontFamily: fonts.heading,
                      fontWeight: 700,
                      fontSize: 13,
                      color: isFirst ? colors.gold : colors.cream,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {e.name}
                  </span>
                  <span
                    style={{
                      fontFamily: fonts.mono,
                      fontWeight: 700,
                      fontSize: 13,
                      color: isFirst ? colors.gold : colors.creamDim70,
                      flexShrink: 0,
                      marginLeft: 8,
                    }}
                  >
                    {format(value)}
                  </span>
                </div>
                <div style={{ height: 10, borderRadius: 100, background: "rgba(245,241,230,0.08)", overflow: "hidden" }}>
                  <div
                    className={isTenseContender ? "kk-bar-tense" : undefined}
                    style={{
                      height: "100%",
                      width: `${widthPct}%`,
                      borderRadius: 100,
                      background: isFirst || isTenseContender
                        ? "linear-gradient(90deg, rgba(255,199,44,0.7), #FFC72C)"
                        : "rgba(245,241,230,0.35)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
