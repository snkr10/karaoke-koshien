// localStorage: ホストはhostToken、参加者はroomCode+participantIdを保存し、
// リロード・再接続時に自分が誰かを復元する

interface HostRecord {
  roomCode: string;
  hostToken: string;
  sessionId: string;
}

interface ParticipantRecord {
  roomCode: string;
  participantId: string;
  name: string;
}

const HOST_KEY = "karaoke-koshien:host";
const PARTICIPANT_KEY = "karaoke-koshien:participant";

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
