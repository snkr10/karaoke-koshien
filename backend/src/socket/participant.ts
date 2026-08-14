import { Server, Socket } from "socket.io";
import { prisma } from "../db";
import { resolveUniqueName } from "../rest/sessions";
import { assertHost, broadcastParticipants, emitError, getSessionByRoomCode } from "./state";

const MAX_AVATAR_VALUE_LENGTH = 300_000; // data URL想定（数十〜100KB程度のJPEGを見込む）

export function registerParticipantHandlers(io: Server, socket: Socket) {
  socket.on(
    "participant:join",
    async (payload: {
      roomCode: string;
      name: string;
      participantId?: string;
      avatarType?: "preset" | "photo";
      avatarValue?: string;
    }) => {
      const session = await getSessionByRoomCode(payload.roomCode);
      if (!session) {
        return emitError(socket, "ROOM_NOT_FOUND", "ルームが見つかりません");
      }

      socket.join(session.roomCode);

      // 既存participantIdでの再参加は再接続として扱う
      if (payload.participantId) {
        const existing = await prisma.participant.findUnique({ where: { id: payload.participantId } });
        if (existing && existing.sessionId === session.id) {
          if (!existing.active) {
            await prisma.participant.update({ where: { id: existing.id }, data: { active: true } });
          }
          socket.emit("participant:joined", { participantId: existing.id, sessionId: session.id });
          await broadcastParticipants(io, session.roomCode, session.id);
          return;
        }
      }

      const name = (payload.name ?? "").trim();
      if (!name) {
        return emitError(socket, "INVALID_NAME", "ニックネームを入力してください");
      }
      if (payload.avatarValue && payload.avatarValue.length > MAX_AVATAR_VALUE_LENGTH) {
        return emitError(socket, "AVATAR_TOO_LARGE", "アイコン画像が大きすぎます");
      }

      const resolvedName = await resolveUniqueName(session.id, name);
      const participant = await prisma.participant.create({
        data: {
          sessionId: session.id,
          name: resolvedName,
          avatarType: payload.avatarType ?? null,
          avatarValue: payload.avatarValue ?? null,
        },
      });

      socket.emit("participant:joined", { participantId: participant.id, sessionId: session.id });
      await broadcastParticipants(io, session.roomCode, session.id);
    }
  );

  socket.on(
    "participant:remove",
    async (payload: { roomCode: string; hostToken: string; participantId: string }) => {
      const { session, valid } = await assertHost(payload.roomCode, payload.hostToken);
      if (!valid || !session) {
        return emitError(socket, "INVALID_HOST_TOKEN", "ホスト権限が確認できませんでした");
      }

      await prisma.participant.update({
        where: { id: payload.participantId },
        data: { active: false },
      });

      await broadcastParticipants(io, session.roomCode, session.id);
    }
  );
}
