// 本番（フロント/バックを1サービスに統合したデプロイ）では同一オリジンなので空文字（相対パス）でよい。
// ローカル開発ではNEXT_PUBLIC_API_BASE_URL=http://localhost:4000 を.env.localで指定する。
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function createSession(): Promise<{ sessionId: string; roomCode: string; hostToken: string }> {
  const res = await fetch(`${API_BASE_URL}/api/sessions`, { method: "POST" });
  if (!res.ok) throw new Error("ルーム作成に失敗しました");
  return res.json();
}

export async function checkSession(roomCode: string): Promise<{ exists: boolean; status?: string }> {
  const res = await fetch(`${API_BASE_URL}/api/sessions/${roomCode}`);
  if (!res.ok) throw new Error("ルーム確認に失敗しました");
  return res.json();
}
