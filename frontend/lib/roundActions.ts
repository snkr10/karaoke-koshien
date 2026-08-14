import { getSocket } from "@/lib/socket";

export type RoundMode = "individual" | "team";

// modeがnull(=ランダム)の場合は個人戦/チーム戦をここで抽選する
export function startRound(roomCode: string, hostToken: string, mode: RoundMode | null) {
  const resolvedMode: RoundMode = mode ?? (Math.random() < 0.5 ? "individual" : "team");
  getSocket().emit("round:start", { roomCode, hostToken, mode: resolvedMode });
}

// ホストの操作で参加者全員の画面も順位表に切り替えさせる
export function showStandingsForEveryone(roomCode: string, hostToken: string) {
  getSocket().emit("standings:show", { roomCode, hostToken });
}

// サプライズモード: 順位表を参加者に公開するかどうかをホストが切り替える
export function setStandingsVisibility(roomCode: string, hostToken: string, visible: boolean) {
  getSocket().emit("standings:set_visibility", { roomCode, hostToken, visible });
}
