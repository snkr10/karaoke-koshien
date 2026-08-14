import { Server, Socket } from "socket.io";
import { prisma } from "../db";
import { generateRoomCode } from "../lib/roomCode";
import { generateHostToken } from "../lib/hostToken";
import { assertHost, buildStateFull, emitError, getSessionByRoomCode } from "./state";

const SESSION_TTL_HOURS = 24;

export function registerSessionHandlers(io: Server, socket: Socket) {
  // ホストがREST APIを使わずSocket.io経由でルーム作成する場合の代替経路
  socket.on("session:host_create", async (_payload: { hostName?: string }) => {
    let roomCode = generateRoomCode();
    for (let i = 0; i < 10 && (await getSessionByRoomCode(roomCode)); i++) {
      roomCode = generateRoomCode();
    }
    const hostToken = generateHostToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

    const session = await prisma.session.create({ data: { roomCode, hostToken, expiresAt } });
    socket.join(session.roomCode);
    socket.emit("session:created", {
      sessionId: session.id,
      roomCode: session.roomCode,
      hostToken,
    });
  });

  socket.on(
    "session:finalize",
    async (payload: { roomCode: string; hostToken: string; decisionMetric: "total_score" | "rank_points" }) => {
      const { session, valid } = await assertHost(payload.roomCode, payload.hostToken);
      if (!valid || !session) {
        return emitError(socket, "INVALID_HOST_TOKEN", "ホスト権限が確認できませんでした");
      }

      await prisma.session.update({ where: { id: session.id }, data: { status: "finished" } });

      const state = await buildStateFull(session.id);
      const metric = payload.decisionMetric;
      const ranking = metric === "total_score" ? state.totalScoreRanking : state.rankPointsRanking;
      const valueKey = metric === "total_score" ? "totalScore" : "rankPoints";

      const participantsById = new Map(state.participants.map((p) => [p.participantId, p.name]));
      const sortedRanking = [...ranking].sort(
        (a: any, b: any) => b[valueKey] - a[valueKey]
      );

      const finalRanking = sortedRanking.map((r: any) => ({
        participantId: r.participantId,
        name: participantsById.get(r.participantId) ?? "",
        value: r[valueKey],
      }));

      io.to(session.roomCode).emit("session:final_result", {
        metric,
        winnerParticipantId: finalRanking[0]?.participantId ?? null,
        ranking: finalRanking,
      });
    }
  );

  // ホストが「順位表を見る」を操作した際、参加者全員の画面も順位表に切り替えさせる
  socket.on(
    "standings:show",
    async (payload: { roomCode: string; hostToken: string }) => {
      const { session, valid } = await assertHost(payload.roomCode, payload.hostToken);
      if (!valid || !session) {
        return emitError(socket, "INVALID_HOST_TOKEN", "ホスト権限が確認できませんでした");
      }
      io.to(session.roomCode).emit("standings:show", {});
    }
  );

  // サプライズモード: ホストが順位表の公開/非公開を切り替える
  socket.on(
    "standings:set_visibility",
    async (payload: { roomCode: string; hostToken: string; visible: boolean }) => {
      const { session, valid } = await assertHost(payload.roomCode, payload.hostToken);
      if (!valid || !session) {
        return emitError(socket, "INVALID_HOST_TOKEN", "ホスト権限が確認できませんでした");
      }
      await prisma.session.update({ where: { id: session.id }, data: { standingsVisible: payload.visible } });
      io.to(session.roomCode).emit("standings:visibility_updated", { standingsVisible: payload.visible });
    }
  );

  socket.on(
    "session:sync_request",
    async (payload: { roomCode: string; participantId?: string }) => {
      const session = await getSessionByRoomCode(payload.roomCode);
      if (!session) {
        return emitError(socket, "ROOM_NOT_FOUND", "ルームが見つかりません");
      }
      socket.join(session.roomCode);
      const state = await buildStateFull(session.id);
      socket.emit("session:state_full", state);
    }
  );
}
