// localStorage: ホストはhostToken、参加者はroomCode+participantIdを保存し、
// リロード・再接続時に自分が誰かを復元する

interface HostRecord {
  roomCode: string;
  hostToken: string;
  sessionId: string;
  participantId?: string;
  name?: string;
}

interface ParticipantRecord {
  roomCode: string;
  participantId: string;
  name: string;
}

const HOST_KEY = "karaoke-koshien:host";
const PARTICIPANT_KEY = "karaoke-koshien:participant";
const ROLE_KEY_PREFIX = "karaoke-koshien:role:";

// hostToken/participantIdはlocalStorage（端末をまたいだ再接続用）に保存する一方、
// 同じブラウザで複数タブを開いて検証する場合に他タブの記録と混同しないよう、
// 「このタブがそのルームでどちらの役割としてログインしたか」はタブ単位のsessionStorageで管理する
export function setSessionRole(roomCode: string, role: "host" | "participant") {
  sessionStorage.setItem(ROLE_KEY_PREFIX + roomCode, role);
}

export function getSessionRole(roomCode: string): "host" | "participant" | null {
  const value = sessionStorage.getItem(ROLE_KEY_PREFIX + roomCode);
  return value === "host" || value === "participant" ? value : null;
}

export function saveHostRecord(record: HostRecord) {
  localStorage.setItem(HOST_KEY, JSON.stringify(record));
}

export function getHostRecord(roomCode: string): HostRecord | null {
  const raw = localStorage.getItem(HOST_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as HostRecord;
    return parsed.roomCode === roomCode ? parsed : null;
  } catch {
    return null;
  }
}

export function saveParticipantRecord(record: ParticipantRecord) {
  localStorage.setItem(PARTICIPANT_KEY, JSON.stringify(record));
}

export function getParticipantRecord(roomCode: string): ParticipantRecord | null {
  const raw = localStorage.getItem(PARTICIPANT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ParticipantRecord;
    return parsed.roomCode === roomCode ? parsed : null;
  } catch {
    return null;
  }
}
