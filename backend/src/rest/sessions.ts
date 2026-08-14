import { Router } from "express";
import { prisma } from "../db";
import { generateRoomCode } from "../lib/roomCode";
import { generateHostToken } from "../lib/hostToken";
import { broadcastParticipants } from "../socket/state";
import { getIoInstance } from "../socket/ioInstance";

export const sessionsRouter = Router();

const SESSION_TTL_HOURS = 24;

async function createUniqueRoomCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateRoomCode();
    const existing = await prisma.session.findUnique({ where: { roomCode: code } });
    if (!existing) return code;
  }
  throw new Error("ルームコードの採番に失敗しました");
}

// POST /api/sessions - ルーム作成
sessionsRouter.post("/sessions", async (_req, res) => {
  const roomCode = await createUniqueRoomCode();
  const hostToken = generateHostToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

  const session = await prisma.session.create({
    data: { roomCode, hostToken, expiresAt },
  });

  res.json({ sessionId: session.id, roomCode: session.roomCode, hostToken });
});

// GET /api/sessions/:roomCode - 参加ページ表示用にルーム存在確認
sessionsRouter.get("/sessions/:roomCode", async (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase();
  const session = await prisma.session.findUnique({ where: { roomCode } });

  if (!session || session.expiresAt < new Date()) {
    return res.json({ exists: false });
  }
  res.json({ exists: true, status: session.status });
});

const MAX_AVATAR_VALUE_LENGTH = 300_000; // data URL想定（数十〜100KB程度のJPEGを見込む）

// POST /api/sessions/:roomCode/participants - 参加者登録
sessionsRouter.post("/sessions/:roomCode/participants", async (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase();
  const { name, avatarType, avatarValue } = req.body as {
    name?: string;
    avatarType?: "preset" | "photo";
    avatarValue?: string;
  };

  if (!name || !name.trim()) {
    return res.status(400).json({ code: "INVALID_NAME", message: "ニックネームを入力してください" });
  }
  if (avatarValue && avatarValue.length > MAX_AVATAR_VALUE_LENGTH) {
    return res.status(400).json({ code: "AVATAR_TOO_LARGE", message: "アイコン画像が大きすぎます" });
  }

  const session = await prisma.session.findUnique({ where: { roomCode } });
  if (!session || session.expiresAt < new Date()) {
    return res.status(404).json({ code: "ROOM_NOT_FOUND", message: "ルームが見つかりません" });
  }

  const resolvedName = await resolveUniqueName(session.id, name.trim());
  const participant = await prisma.participant.create({
    data: {
      sessionId: session.id,
      name: resolvedName,
      avatarType: avatarType ?? null,
      avatarValue: avatarValue ?? null,
    },
  });

  await broadcastParticipants(getIoInstance(), session.roomCode, session.id);
  res.json({ participantId: participant.id, sessionId: session.id, name: resolvedName });
});

// 同名参加者がいる場合「名前(2)」のように連番を付与する
export async function resolveUniqueName(sessionId: string, baseName: string): Promise<string> {
  const existing = await prisma.participant.findMany({
    where: { sessionId },
    select: { name: true },
  });
  const names = new Set(existing.map((p) => p.name));
  if (!names.has(baseName)) return baseName;

  let n = 2;
  while (names.has(`${baseName}(${n})`)) n++;
  return `${baseName}(${n})`;
}
