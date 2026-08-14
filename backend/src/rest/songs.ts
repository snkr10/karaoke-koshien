import { Router } from "express";
import { prisma } from "../db";

export const songsRouter = Router();

// GET /api/songs/random?exclude=uuid1,uuid2 - DAMランキングからランダムに1曲取得
songsRouter.get("/songs/random", async (req, res) => {
  const latest = await prisma.song.findFirst({ orderBy: { scrapedAt: "desc" } });
  if (!latest) {
    return res.status(404).json({ code: "NO_SONGS", message: "曲データがありません" });
  }

  const excludeParam = (req.query.exclude as string | undefined) ?? "";
  const excludeIds = excludeParam.split(",").map((s) => s.trim()).filter(Boolean);

  const candidates = await prisma.song.findMany({
    where: {
      scrapedAt: latest.scrapedAt,
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
    },
  });

  const pool = candidates.length > 0
    ? candidates
    : await prisma.song.findMany({ where: { scrapedAt: latest.scrapedAt } });

  const picked = pool[Math.floor(Math.random() * pool.length)];
  res.json({ id: picked.id, title: picked.title, artist: picked.artist });
});
