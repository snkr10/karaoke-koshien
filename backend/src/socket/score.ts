import { Server, Socket } from "socket.io";
import { prisma } from "../db";
import { computeRankPointsForRound } from "../lib/ranking";
import { assertHost, broadcastRankings, emitError } from "./state";

async function applyScore(
  io: Server,
  socket: Socket,
  sessionId: string,
  roomCode: string,
  performanceId: string,
  rawScore: number
) {
  const performance = await prisma.performance.findUnique({
    where: { id: performanceId },
    include: { round: true },
  });
  if (!performance || performance.round.sessionId !== sessionId) {
    return emitError(socket, "ROOM_NOT_FOUND", "対象のパフォーマンスが見つかりません");
  }
  if (performance.round.locked) {
    return emitError(socket, "DUPLICATE_NAME_LOCKED", "このラウンドは既に確定済みのため修正できません");
  }

  await prisma.performance.update({ where: { id: performanceId }, data: { rawScore } });
  io.to(roomCode).emit("score:updated", { performanceId, rawScore });

  const roundPerformances = await prisma.performance.findMany({ where: { roundId: performance.roundId } });
  const allScored = roundPerformances.every((p) => p.rawScore !== null || p.id === performanceId);

  if (allScored) {
    const scored = roundPerformances.map((p) => ({
      id: p.id,
      rawScore: p.id === performanceId ? rawScore : Number(p.rawScore),
    }));
    const rankPointsMap = computeRankPointsForRound(scored);
    for (const [id, points] of rankPointsMap.entries()) {
      await prisma.performance.update({ where: { id }, data: { rankPoints: points } });
    }
    await broadcastRankings(io, roomCode, sessionId);
  }
}

export function registerScoreHandlers(io: Server, socket: Socket) {
  socket.on(
    "score:submit",
    async (payload: { roomCode: string; hostToken: string; performanceId: string; rawScore: number }) => {
      const { session, valid } = await assertHost(payload.roomCode, payload.hostToken);
      if (!valid || !session) {
        return emitError(socket, "INVALID_HOST_TOKEN", "ホスト権限が確認できませんでした");
      }
      await applyScore(io, socket, session.id, session.roomCode, payload.performanceId, payload.rawScore);
    }
  );

  socket.on(
    "score:correct",
    async (payload: { roomCode: string; hostToken: string; performanceId: string; rawScore: number }) => {
      const { session, valid } = await assertHost(payload.roomCode, payload.hostToken);
      if (!valid || !session) {
        return emitError(socket, "INVALID_HOST_TOKEN", "ホスト権限が確認できませんでした");
      }
      await applyScore(io, socket, session.id, session.roomCode, payload.performanceId, payload.rawScore);
    }
  );
}
