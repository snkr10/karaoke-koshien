import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

let socket: Socket | null = null;

// カラオケボックス内の回線不安定を想定し、切断→再接続を検知したら
// 呼び出し側でsession:sync_requestを送って最新状態を取り直す運用にする
// （このモジュールはソケットのシングルトン管理のみを担当）
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, { autoConnect: true, reconnection: true });
  }
  return socket;
}
