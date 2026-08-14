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

const DURATION_MS = 2600;
const ROW_HEIGHT = 60;
const ROW_GAP = 10;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

// 横棒グラフレース演出。最終値には正しく収束しつつ、演出用にランダムな揺らぎを与えて
// 途中経過で順位が入れ替わっているように見せる（実データではなく演出目的のアニメーション）
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
        { amplitude: 0.12 + Math.random() * 0.2, freq: 1 + Math.random() * 1.6, phase: Math.random() * Math.PI * 2 },
      ])
    )
  );

  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(entries.map((e) => [e.participantId, 0]))
  );
  const [ranks, setRanks] = useState<Record<string, number>>(() =>
    Object.fromEntries(entries.map((e, i) => [e.participantId, i]))
  );

  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    let done = false;

    const step = (ts: number) => {
      if (start === null) start = ts;
      const elapsed = ts - start;
      const t = Math.min(1, elapsed / DURATION_MS);
      const eased = easeOutCubic(t);

      const nextValues: Record<string, number> = {};
      for (const e of entries) {
        const meta = metaRef.current[e.participantId];
        if (t >= 1) {
          nextValues[e.participantId] = e.value;
        } else {
          const wobble = meta.amplitude * Math.sin(t * Math.PI * meta.freq + meta.phase) * (1 - t);
          const factor = Math.max(0, Math.min(1.05, eased + wobble));
          nextValues[e.participantId] = e.value * factor;
        }
      }
      setValues(nextValues);

      const sorted = [...entries].sort((a, b) => nextValues[b.participantId] - nextValues[a.participantId]);
      setRanks(Object.fromEntries(sorted.map((e, i) => [e.participantId, i])));

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
                  style={{
                    height: "100%",
                    width: `${widthPct}%`,
                    borderRadius: 100,
                    background: isFirst
                      ? "linear-gradient(90deg, rgba(255,199,44,0.7), #FFC72C)"
                      : "rgba(245,241,230,0.35)",
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
