import { Server } from "socket.io";
import { prisma } from "../db";
import { aggregateByParticipant, aggregateComposite } from "../lib/ranking";

export function emitError(
  socket: { emit: (event: string, payload: unknown) => void },
  code: string,
  message: string
) {
  socket.emit("error", { code, message });
}

export async function getSessionByRoomCode(roomCode: string) {
  const session = await prisma.session.findUnique({ where: { roomCode: roomCode.toUpperCase() } });
  if (!session || session.expiresAt < new Date()) return null;
  return session;
}

export async function assertHost(roomCode: string, hostToken: string) {
  const session = await getSessionByRoomCode(roomCode);
  if (!session) return { session: null, valid: false as const };
  if (session.hostToken !== hostToken) return { session, valid: false as const };
  return { session, valid: true as const };
}

export async function broadcastParticipants(io: Server, roomCode: string, sessionId: string) {
  const participants = await prisma.participant.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });
  io.to(roomCode).emit("session:state", {
    participants: participants.map((p) => ({
      participantId: p.id,
      name: p.name,
      active: p.active,
      avatarType: p.avatarType,
      avatarValue: p.avatarValue,
    })),
  });
}

async function getAllPerformanceMembershipRows(sessionId: string) {
  const rounds = await prisma.round.findMany({
    where: { sessionId },
    include: { performances: { include: { members: true } } },
  });

  const rows: { participantId: string; rawScore: number | null; rankPoints: number | null }[] = [];
  for (const round of rounds) {
    for (const perf of round.performances) {
      for (const member of perf.members) {
        rows.push({
          participantId: member.participantId,
          rawScore: perf.rawScore !== null ? Number(perf.rawScore) : null,
          rankPoints: perf.rankPoints,
        });
      }
    }
  }
  return rows;
}

export async function computeRankings(sessionId: string) {
  const rows = await getAllPerformanceMembershipRows(sessionId);
  const totalScoreRanking = aggregateByParticipant(rows, "rawScore").map((r) => ({
    participantId: r.participantId,
    totalScore: r.value,
  }));
  const rankPointsRanking = aggregateByParticipant(rows, "rankPoints").map((r) => ({
    participantId: r.participantId,
    rankPoints: r.value,
  }));
  const compositeRanking = aggregateComposite(rows).map((r) => ({
    participantId: r.participantId,
    composite: r.value,
  }));
  return { totalScoreRanking, rankPointsRanking, compositeRanking };
}

export async function broadcastRankings(io: Server, roomCode: string, sessionId: string) {
  const rankings = await computeRankings(sessionId);
  io.to(roomCode).emit("ranking:updated", rankings);
}

export async function getCurrentRoundFull(sessionId: string) {
  const round = await prisma.round.findFirst({
    where: { sessionId },
    orderBy: { roundNumber: "desc" },
    include: { performances: { orderBy: { order: "asc" }, include: { members: true } } },
  });
  return round;
}

export async function serializeRoundStarted(sessionId: string) {
  const round = await getCurrentRoundFull(sessionId);
  if (!round) return null;
  return {
    roundId: round.id,
    roundNumber: round.roundNumber,
    mode: round.mode,
    performances: round.performances.map((perf, i) => ({
      performanceId: perf.id,
      order: i + 1,
      memberIds: perf.members.map((m) => m.participantId),
      suggestedSong: { title: perf.songTitle, artist: perf.songArtist ?? "" },
      rawScore: perf.rawScore !== null ? Number(perf.rawScore) : null,
      rankPoints: perf.rankPoints,
    })),
  };
}

export type DecisionMetric = "total_score" | "rank_points" | "composite";

// 最終発表で使う「誰が優勝か・最終順位一覧」を、指定の指標で算出する。
// finalizeの瞬間だけでなく、finalMetricを保存しておけば再接続時にも同じ結果を再現できる
export async function computeFinalResult(sessionId: string, metric: DecisionMetric) {
  const [rankings, participants] = await Promise.all([
    computeRankings(sessionId),
    prisma.participant.findMany({ where: { sessionId } }),
  ]);
  const ranking =
    metric === "total_score"
      ? rankings.totalScoreRanking
      : metric === "rank_points"
        ? rankings.rankPointsRanking
        : rankings.compositeRanking;
  const valueKey = metric === "total_score" ? "totalScore" : metric === "rank_points" ? "rankPoints" : "composite";

  const participantsById = new Map(participants.map((p) => [p.id, p.name]));
  const sortedRanking = [...ranking].sort((a: any, b: any) => b[valueKey] - a[valueKey]);

  const finalRanking = sortedRanking.map((r: any) => ({
    participantId: r.participantId,
    name: participantsById.get(r.participantId) ?? "",
    value: r[valueKey],
  }));

  return {
    metric,
    winnerParticipantId: finalRanking[0]?.participantId ?? null,
    ranking: finalRanking,
  };
}

export async function buildStateFull(sessionId: string) {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  const participants = await prisma.participant.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });
  const currentRound = await serializeRoundStarted(sessionId);
  const rankings = await computeRankings(sessionId);
  const finalResult =
    session?.status === "finished" && session.finalMetric
      ? await computeFinalResult(sessionId, session.finalMetric as DecisionMetric)
      : null;

  return {
    session: { status: session?.status ?? "waiting", standingsVisible: session?.standingsVisible ?? true },
    participants: participants.map((p) => ({
      participantId: p.id,
      name: p.name,
      active: p.active,
      avatarType: p.avatarType,
      avatarValue: p.avatarValue,
    })),
    currentRound,
    totalScoreRanking: rankings.totalScoreRanking,
    rankPointsRanking: rankings.rankPointsRanking,
    compositeRanking: rankings.compositeRanking,
    finalResult,
  };
}
