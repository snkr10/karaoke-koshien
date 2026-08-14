-- 順位表の公開/非公開のデフォルトをOFF（非公開）に変更
ALTER TABLE "sessions" ALTER COLUMN "standings_visible" SET DEFAULT false;
