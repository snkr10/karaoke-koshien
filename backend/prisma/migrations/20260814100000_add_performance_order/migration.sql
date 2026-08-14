-- 歌う順番（表示・得点入力の並び順）を保持するカラムを追加
ALTER TABLE "performances" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
