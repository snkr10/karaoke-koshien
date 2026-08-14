// DAMランキング(週間)スクレイピングスクリプト
// 対象: https://www.clubdam.com/ranking/
// ページは完全にサーバーサイドレンダリングされた静的HTMLで、
// TOP100全件がロード時点でDOMに存在するためヘッドレスブラウザは不要（cheerioのみで完結）。
//
// DOM構造（2026年時点で確認済み）:
//   6つの <ul class="p-song-list p-ranking-list"> が
//   デイリー[0] / 週間[1] / 月間[2] / 上半期[3] / 下半期[4] / 年間[5] の順に並ぶ。
//   各曲は <li class="p-ranking-list__item">。
//     順位   : .p-ranking__num のテキスト
//     曲名   : .p-song__title のテキスト
//     アーティスト: .p-song__artist のテキスト（先頭の1つ）
//     曲固有ID : a.p-song--song の href に含まれる requestNo=XXXX-XX
//
// 取得0件の場合はエラーとして扱い、既存データ（songsテーブル）は上書きせずそのまま残す
// （dam-scraping.md 3章・5章の方針通り）。

import * as cheerio from "cheerio";
import { prisma } from "../src/db";

const RANKING_URL = "https://www.clubdam.com/ranking/";
const WEEKLY_LIST_INDEX = 1;

interface ScrapedSong {
  rank: number;
  title: string;
  artist: string;
  damRequestNo: string | null;
}

function extractRequestNo(href: string | undefined): string | null {
  if (!href) return null;
  const match = href.match(/requestNo=([\w-]+)/);
  return match ? match[1] : null;
}

async function scrapeWeeklyRanking(): Promise<ScrapedSong[]> {
  const res = await fetch(RANKING_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; KaraokeKoshienBot/1.0)" },
  });
  if (!res.ok) {
    throw new Error(`DAMランキングページの取得に失敗しました: HTTP ${res.status}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  const lists = $("ul.p-song-list.p-ranking-list");
  const weeklyList = lists.eq(WEEKLY_LIST_INDEX);
  const items = weeklyList.find("li.p-ranking-list__item");

  const songs: ScrapedSong[] = [];
  items.each((_i, el) => {
    const item = $(el);
    const rankText = item.find(".p-ranking__num").first().text().trim();
    const title = item.find(".p-song__title").first().text().trim();
    const artist = item.find(".p-song__artist").first().text().trim();
    const href = item.find("a.p-song--song").first().attr("href");
    const rank = Number(rankText);

    if (!title || !Number.isFinite(rank)) return;
    songs.push({ rank, title, artist, damRequestNo: extractRequestNo(href) });
  });

  return songs;
}

async function main() {
  console.log(`DAM週間ランキングを取得中... (${RANKING_URL})`);
  let songs: ScrapedSong[];
  try {
    songs = await scrapeWeeklyRanking();
  } catch (err) {
    console.error("スクレイピングに失敗しました。既存データを保持します。", err);
    process.exitCode = 1;
    return;
  }

  if (songs.length === 0) {
    console.error("取得件数が0件でした（HTML構造が変わった可能性）。既存データを保持します。");
    process.exitCode = 1;
    return;
  }

  const scrapedAt = new Date();
  await prisma.song.createMany({
    data: songs.map((s) => ({
      title: s.title,
      artist: s.artist,
      damRank: s.rank,
      damRequestNo: s.damRequestNo,
      scrapedAt,
    })),
  });

  console.log(`${songs.length}件の曲を保存しました (scrapedAt=${scrapedAt.toISOString()})`);
  console.log("先頭5件:", songs.slice(0, 5).map((s) => `${s.rank}. ${s.title} / ${s.artist}`).join("\n"));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
