import { io, Socket } from "socket.io-client";

// 本番（フロント/バックを1サービスに統合したデプロイ）では同一オリジンに繋げばよいので
// URL未指定でよい（socket.io-clientが現在のページのoriginに自動接続する）。
// ローカル開発ではNEXT_PUBLIC_SOCKET_URL=http://localhost:4000 を.env.localで指定する。
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

let socket: Socket | null = null;

// カラオケボックス内の回線不安定を想定し、切断→再接続を検知したら
// 呼び出し側でsession:sync_requestを送って最新状態を取り直す運用にする
// （このモジュールはソケットのシングルトン管理のみを担当）
export function getSocket(): Socket {
  if (!socket) {
    socket = SOCKET_URL
      ? io(SOCKET_URL, { autoConnect: true, reconnection: true })
      : io({ autoConnect: true, reconnection: true });
  }
  return socket;
}
