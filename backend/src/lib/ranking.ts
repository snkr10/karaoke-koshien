// 総得点ランキング／勝敗ポイントランキングの集計ロジック（design.md 4章）
// - 総得点: participantが関わったperformanceのraw_scoreを合計
// - 勝敗ポイント: participantが関わったperformanceのrank_pointsを合計
//   (1ラウンド内で1位2pt/2位1pt/それ以外0pt。同点は同順位扱い)

export interface PerformanceForRanking {
  id: string;
  rawScore: number;
}

// 1ラウンド分のperformance得点から、各performanceのrank_pointsを算出する
export function computeRankPointsForRound(
  performances: PerformanceForRanking[]
): Map<string, number> {
  const sorted = [...performances].sort((a, b) => b.rawScore - a.rawScore);
  const result = new Map<string, number>();

  let prevScore: number | null = null;
  let prevRank = 0;
  sorted.forEach((perf, index) => {
    const rank = prevScore !== null && perf.rawScore === prevScore ? prevRank : index + 1;
    const points = rank === 1 ? 2 : rank === 2 ? 1 : 0;
    result.set(perf.id, points);
    prevScore = perf.rawScore;
    prevRank = rank;
  });

  return result;
}

export interface PerformanceMembershipRow {
  participantId: string;
  rawScore: number | null;
  rankPoints: number | null;
}

export interface ParticipantRankingEntry {
  participantId: string;
  value: number;
}

export function aggregateByParticipant(
  rows: PerformanceMembershipRow[],
  field: "rawScore" | "rankPoints"
): ParticipantRankingEntry[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const val = row[field];
    if (val === null) continue;
    totals.set(row.participantId, (totals.get(row.participantId) ?? 0) + val);
  }
  return Array.from(totals.entries())
    .map(([participantId, value]) => ({ participantId, value }))
    .sort((a, b) => b.value - a.value);
}

// 総合力スコア = 勝敗ポイント合計 × COMPOSITE_RANK_POINT_WEIGHT + 平均得点
// 勝敗ポイントを主軸にしつつ、平均得点で拮抗させる独自のブレンド指標
// （合計ではなく平均を使うことで、出場回数や1回の高得点だけで差が開きすぎないようにする）
export const COMPOSITE_RANK_POINT_WEIGHT = 5;

export function aggregateComposite(rows: PerformanceMembershipRow[]): ParticipantRankingEntry[] {
  const rankPointTotals = new Map<string, number>();
  const scoreTotals = new Map<string, number>();
  const scoreCounts = new Map<string, number>();

  for (const row of rows) {
    if (row.rankPoints !== null) {
      rankPointTotals.set(row.participantId, (rankPointTotals.get(row.participantId) ?? 0) + row.rankPoints);
    }
    if (row.rawScore !== null) {
      scoreTotals.set(row.participantId, (scoreTotals.get(row.participantId) ?? 0) + row.rawScore);
      scoreCounts.set(row.participantId, (scoreCounts.get(row.participantId) ?? 0) + 1);
    }
  }

  const participantIds = new Set([...rankPointTotals.keys(), ...scoreTotals.keys()]);
  return Array.from(participantIds)
    .map((participantId) => {
      const rankPoints = rankPointTotals.get(participantId) ?? 0;
      const count = scoreCounts.get(participantId) ?? 0;
      const averageScore = count > 0 ? (scoreTotals.get(participantId) ?? 0) / count : 0;
      return { participantId, value: rankPoints * COMPOSITE_RANK_POINT_WEIGHT + averageScore };
    })
    .sort((a, b) => b.value - a.value);
}
