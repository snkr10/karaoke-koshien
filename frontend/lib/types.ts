export interface ParticipantInfo {
  participantId: string;
  name: string;
  active: boolean;
  avatarType?: "preset" | "photo" | null;
  avatarValue?: string | null;
}

export interface PerformanceInfo {
  performanceId: string;
  order: number;
  memberIds: string[];
  suggestedSong: { title: string; artist: string };
  rawScore: number | null;
  rankPoints: number | null;
}

export interface RoundInfo {
  roundId: string;
  roundNumber: number;
  mode: "individual" | "team";
  performances: PerformanceInfo[];
}

export interface RankingEntry {
  participantId: string;
  totalScore?: number;
  rankPoints?: number;
}

export interface FinalResult {
  metric: "total_score" | "rank_points";
  winnerParticipantId: string | null;
  ranking: { participantId: string; name: string; value: number }[];
}

export type LocalView = "participants" | "round" | "score" | "standings" | "final";
