-- 参加者アイコン（プリセット絵文字 or 写真/カメラのdata URL）を保持するカラムを追加
ALTER TABLE "participants" ADD COLUMN "avatar_type" TEXT;
ALTER TABLE "participants" ADD COLUMN "avatar_value" TEXT;
