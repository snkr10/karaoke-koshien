-- 順位表の公開/非公開を切り替えるサプライズモード用カラムを追加
ALTER TABLE "sessions" ADD COLUMN "standings_visible" BOOLEAN NOT NULL DEFAULT true;
