export interface AvatarValue {
  avatarType: "preset" | "photo";
  avatarValue: string;
}

// カラオケ甲子園らしいプリセット絵文字アイコン
export const PRESET_AVATARS = [
  "🎤",
  "🎧",
  "🎶",
  "⭐",
  "🔥",
  "🐯",
  "🌟",
  "🎸",
  "🥇",
  "🎵",
  "🚩",
  "👑",
];

const AVATAR_SIZE = 240;
const JPEG_QUALITY = 0.82;

// 選択された画像ファイルを正方形にクロップ・リサイズし、軽量なJPEG data URLに変換する
export function fileToAvatarDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    reader.onload = () => {
      img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = AVATAR_SIZE;
        canvas.height = AVATAR_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("画像の処理に失敗しました"));

        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
