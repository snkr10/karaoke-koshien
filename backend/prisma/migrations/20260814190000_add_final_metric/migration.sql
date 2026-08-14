-- 最終発表で使われた決定指標を保持し、再接続時にも最終結果を復元できるようにする
ALTER TABLE "sessions" ADD COLUMN "final_metric" TEXT;
