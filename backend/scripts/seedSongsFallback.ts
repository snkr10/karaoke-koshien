// ローカル動作確認用のフォールバック曲データ投入スクリプト
// DAMへ毎回スクレイピングをかけなくても選曲機能を確認できるようにするための開発用シード

import { prisma } from "../src/db";

const FALLBACK_SONGS: { title: string; artist: string; rank: number }[] = [
  { title: "好きすぎて滅！", artist: "M!LK", rank: 1 },
  { title: "怪獣の花唄", artist: "Vaundy", rank: 2 },
  { title: "マリーゴールド", artist: "あいみょん", rank: 3 },
  { title: "残酷な天使のテーゼ", artist: "高橋洋子", rank: 4 },
  { title: "ダーリン", artist: "Mrs. GREEN APPLE", rank: 5 },
  { title: "水平線", artist: "back number", rank: 6 },
  { title: "さよならエレジー", artist: "菅田将暉", rank: 7 },
  { title: "サウダージ", artist: "ポルノグラフィティ", rank: 8 },
  { title: "高嶺の花子さん", artist: "back number", rank: 9 },
  { title: "ドライフラワー", artist: "優里", rank: 10 },
  { title: "YELL", artist: "いきものがかり", rank: 11 },
  { title: "ロビンソン", artist: "スピッツ", rank: 12 },
  { title: "白日", artist: "King Gnu", rank: 13 },
  { title: "Lemon", artist: "米津玄師", rank: 14 },
  { title: "紅蓮華", artist: "LiSA", rank: 15 },
  { title: "パプリカ", artist: "Foorin", rank: 16 },
  { title: "打上花火", artist: "DAOKO×米津玄師", rank: 17 },
  { title: "花束", artist: "back number", rank: 18 },
  { title: "アイドル", artist: "YOASOBI", rank: 19 },
  { title: "群青", artist: "YOASOBI", rank: 20 },
];

async function main() {
  const scrapedAt = new Date();
  await prisma.song.createMany({
    data: FALLBACK_SONGS.map((s) => ({
      title: s.title,
      artist: s.artist,
      damRank: s.rank,
      damRequestNo: null,
      scrapedAt,
    })),
  });
  console.log(`フォールバック曲データ ${FALLBACK_SONGS.length}件を投入しました`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
