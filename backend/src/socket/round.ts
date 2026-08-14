import { Server, Socket } from "socket.io";
import { prisma } from "../db";
import { makeTeamPairs, Group } from "../lib/pairing";
import { assertHost, emitError, serializeRoundStarted } from "./state";

async function getActiveParticipantIds(sessionId: string): Promise<string[]> {
  const participants = await prisma.participant.findMany({
    where: { sessionId, active: true },
    orderBy: { createdAt: "asc" },
  });
  return participants.map((p) => p.id);
}

async function getPreviousTeamPairs(sessionId: string, beforeRoundNumber: number): Promise<Group[]> {
  const prevRound = await prisma.round.findFirst({
    where: { sessionId, roundNumber: { lt: beforeRoundNumber }, mode: "team" },
    orderBy: { roundNumber: "desc" },
    include: { performances: { include: { members: true } } },
  });
  if (!prevRound) return [];
  return prevRound.performances
    .filter((p) => p.members.length === 2)
    .map((p) => p.members.map((m) => m.participantId));
}

async function createPerformancesForGroups(roundId: string, groups: Group[]) {
  const usedSongIds: string[] = [];
  for (const group of groups) {
    const song = await pickSongExcludingWithTracking(usedSongIds);
    const performance = await prisma.performance.create({
      data: {
        roundId,
        songTitle: song.title,
        songArtist: song.artist,
      },
    });
    await prisma.performanceMember.createMany({
      data: group.map((participantId) => ({ performanceId: performance.id, participantId })),
    });
  }
}

async function pickSongExcludingWithTracking(usedSongIds: string[]) {
  const latest = await prisma.song.findFirst({ orderBy: { scrapedAt: "desc" } });
  if (!latest) return { title: "（曲データなし）", artist: null as string | null };

  const candidates = await prisma.song.findMany({
    where: { scrapedAt: latest.scrapedAt, id: { notIn: usedSongIds } },
  });
  const pool = candidates.length > 0
    ? candidates
    : await prisma.song.findMany({ where: { scrapedAt: latest.scrapedAt } });

  const picked = pool[Math.floor(Math.random() * pool.length)];
  if (picked) usedSongIds.push(picked.id);
  return { title: picked?.title ?? "（曲データなし）", artist: picked?.artist ?? null };
}

export function registerRoundHandlers(io: Server, socket: Socket) {
  socket.on(
    "round:start",
    async (payload: { roomCode: string; hostToken: string; mode: "individual" | "team" }) => {
      const { session, valid } = await assertHost(payload.roomCode, payload.hostToken);
      if (!valid || !session) {
        return emitError(socket, "INVALID_HOST_TOKEN", "ホスト権限が確認できませんでした");
      }

      const activeIds = await getActiveParticipantIds(session.id);
      if (activeIds.length < 2) {
        return emitError(socket, "NOT_ENOUGH_PARTICIPANTS", "参加者が足りません（最低2人必要です）");
      }

      // 現在進行中のラウンドをロック（得点修正不可にする）
      await prisma.round.updateMany({ where: { sessionId: session.id }, data: { locked: true } });

      const lastRound = await prisma.round.findFirst({
        where: { sessionId: session.id },
        orderBy: { roundNumber: "desc" },
      });
      const roundNumber = (lastRound?.roundNumber ?? 0) + 1;

      const round = await prisma.round.create({
        data: { sessionId: session.id, roundNumber, mode: payload.mode },
      });

      let groups: Group[];
      if (payload.mode === "team") {
        const previousPairs = await getPreviousTeamPairs(session.id, roundNumber);
        groups = makeTeamPairs(activeIds, previousPairs);
      } else {
        groups = activeIds.map((id) => [id]);
      }

      await createPerformancesForGroups(round.id, groups);
      await prisma.session.update({ where: { id: session.id }, data: { status: "in_progress" } });

      const started = await serializeRoundStarted(session.id);
      io.to(session.roomCode).emit("round:started", started);
    }
  );

  socket.on(
    "round:reshuffle_pairs",
    async (payload: { roomCode: string; hostToken: string; roundId: string }) => {
      const { session, valid } = await assertHost(payload.roomCode, payload.hostToken);
      if (!valid || !session) {
        return emitError(socket, "INVALID_HOST_TOKEN", "ホスト権限が確認できませんでした");
      }

      const round = await prisma.round.findUnique({
        where: { id: payload.roundId },
        include: { performances: { include: { members: true } } },
      });
      if (!round || round.sessionId !== session.id || round.mode !== "team" || round.locked) {
        return emitError(socket, "INVALID_ROUND", "この操作は現在のラウンドでは行えません");
      }

      const participantIds = round.performances.flatMap((p) => p.members.map((m) => m.participantId));
      const previousPairs = await getPreviousTeamPairs(session.id, round.roundNumber);

      await prisma.performance.deleteMany({ where: { roundId: round.id } });

      const groups = makeTeamPairs(participantIds, previousPairs);
      await createPerformancesForGroups(round.id, groups);

      const started = await serializeRoundStarted(session.id);
      io.to(session.roomCode).emit("round:started", started);
    }
  );
}
