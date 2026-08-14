"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { getHostRecord, getParticipantRecord, getSessionRole, setSessionRole } from "@/lib/storage";
import { FinalResult, LocalView, ParticipantInfo, RoundInfo } from "@/lib/types";
import { ParticipantsView } from "./_views/ParticipantsView";
import { RoundAnnounceView } from "./_views/RoundAnnounceView";
import { ScoreInputView } from "./_views/ScoreInputView";
import { StandingsView } from "./_views/StandingsView";
import { FinalRevealView } from "./_views/FinalRevealView";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { colors, fonts } from "@/lib/theme";

interface RankingRow {
  participantId: string;
  totalScore?: number;
  rankPoints?: number;
  composite?: number;
}

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const roomCode = (params.code as string).toUpperCase();
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<"host" | "participant" | null>(null);
  const [hostToken, setHostToken] = useState<string | null>(null);
  const [selfParticipantId, setSelfParticipantId] = useState<string | null>(null);

  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [currentRound, setCurrentRound] = useState<RoundInfo | null>(null);
  const [totalScoreRanking, setTotalScoreRanking] = useState<RankingRow[]>([]);
  const [rankPointsRanking, setRankPointsRanking] = useState<RankingRow[]>([]);
  const [compositeRanking, setCompositeRanking] = useState<RankingRow[]>([]);
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [localView, setLocalView] = useState<LocalView>("participants");
  const [standingsVisible, setStandingsVisible] = useState(true);

  // 自分がホストか参加者かを復元する。
  // hostToken/participantIdはlocalStorage（端末をまたいだ再接続用）に保存されているが、
  // 同じブラウザで複数タブ（例: ホスト用タブと参加者用タブ）を開いて検証している場合に
  // 他タブの記録と混同しないよう、まずタブ単位のsessionStorageの役割ヒントを優先する
  useEffect(() => {
    const hint = getSessionRole(roomCode);

    if (hint === "participant") {
      const participant = getParticipantRecord(roomCode);
      if (participant) {
        setRole("participant");
        setSelfParticipantId(participant.participantId);
        setReady(true);
        return;
      }
    }

    if (hint === "host" || hint === null) {
      const host = getHostRecord(roomCode);
      if (host) {
        setRole("host");
        setHostToken(host.hostToken);
        if (host.participantId) setSelfParticipantId(host.participantId);
        setSessionRole(roomCode, "host");
        setReady(true);
        return;
      }
    }

    const participant = getParticipantRecord(roomCode);
    if (participant) {
      setRole("participant");
      setSelfParticipantId(participant.participantId);
      setSessionRole(roomCode, "participant");
      setReady(true);
      return;
    }

    router.replace(`/join?code=${roomCode}`);
  }, [roomCode, router]);

  useEffect(() => {
    if (!ready) return;
    const socket = getSocket();

    const requestSync = () => {
      socket.emit("session:sync_request", { roomCode, participantId: selfParticipantId ?? undefined });
    };

    const onStateFull = (state: {
      session: { status: string; standingsVisible?: boolean };
      participants: ParticipantInfo[];
      currentRound: RoundInfo | null;
      totalScoreRanking: RankingRow[];
      rankPointsRanking: RankingRow[];
      compositeRanking: RankingRow[];
    }) => {
      setParticipants(state.participants);
      setCurrentRound(state.currentRound);
      setTotalScoreRanking(state.totalScoreRanking);
      setRankPointsRanking(state.rankPointsRanking);
      setCompositeRanking(state.compositeRanking);
      setStandingsVisible(state.session.standingsVisible ?? true);
      if (state.currentRound) setLocalView((prev) => (prev === "participants" ? "round" : prev));
    };

    const onState = (payload: { participants: ParticipantInfo[] }) => {
      setParticipants(payload.participants);
    };

    const onRoundStarted = (round: RoundInfo) => {
      setCurrentRound(round);
      setLocalView("round");
    };

    const onScoreUpdated = (payload: { performanceId: string; rawScore: number }) => {
      setCurrentRound((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          performances: prev.performances.map((p) =>
            p.performanceId === payload.performanceId ? { ...p, rawScore: payload.rawScore } : p
          ),
        };
      });
    };

    const onRankingUpdated = (payload: {
      totalScoreRanking: RankingRow[];
      rankPointsRanking: RankingRow[];
      compositeRanking: RankingRow[];
    }) => {
      setTotalScoreRanking(payload.totalScoreRanking);
      setRankPointsRanking(payload.rankPointsRanking);
      setCompositeRanking(payload.compositeRanking);
    };

    const onFinalResult = (payload: FinalResult) => {
      setFinalResult(payload);
      setLocalView("final");
    };

    const onError = (payload: { code: string; message: string }) => {
      setErrorMessage(payload.message);
      setTimeout(() => setErrorMessage(null), 4000);
    };

    // ホストの「順位表を見る」操作を受けて、参加者を含む全員の画面を順位表に切り替える
    const onStandingsShow = () => {
      setLocalView((prev) => (prev === "final" ? prev : "standings"));
    };

    // サプライズモード: ホストが順位表の公開/非公開を切り替えたら全員に反映
    const onStandingsVisibility = (payload: { standingsVisible: boolean }) => {
      setStandingsVisible(payload.standingsVisible);
    };

    socket.on("connect", requestSync);
    socket.on("session:state_full", onStateFull);
    socket.on("session:state", onState);
    socket.on("round:started", onRoundStarted);
    socket.on("score:updated", onScoreUpdated);
    socket.on("ranking:updated", onRankingUpdated);
    socket.on("session:final_result", onFinalResult);
    socket.on("standings:show", onStandingsShow);
    socket.on("standings:visibility_updated", onStandingsVisibility);
    socket.on("error", onError);

    if (socket.connected) requestSync();

    return () => {
      socket.off("connect", requestSync);
      socket.off("session:state_full", onStateFull);
      socket.off("session:state", onState);
      socket.off("round:started", onRoundStarted);
      socket.off("score:updated", onScoreUpdated);
      socket.off("ranking:updated", onRankingUpdated);
      socket.off("session:final_result", onFinalResult);
      socket.off("standings:show", onStandingsShow);
      socket.off("standings:visibility_updated", onStandingsVisibility);
      socket.off("error", onError);
    };
  }, [ready, roomCode, selfParticipantId]);

  const participantsById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of participants) map[p.participantId] = p.name;
    return map;
  }, [participants]);

  const participantsMap = useMemo(() => {
    const map: Record<string, ParticipantInfo> = {};
    for (const p of participants) map[p.participantId] = p;
    return map;
  }, [participants]);

  if (!ready || !role) {
    return (
      <ScreenShell align="center" padding="0">
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: fonts.body, fontSize: 13, color: colors.creamDim55 }}>読み込み中...</div>
        </div>
      </ScreenShell>
    );
  }

  const commonProps = {
    roomCode,
    role,
    hostToken,
    selfParticipantId,
    participants,
    participantsById,
    participantsMap,
    currentRound,
    totalScoreRanking,
    rankPointsRanking,
    compositeRanking,
    standingsVisible,
    errorMessage,
    onNavigate: setLocalView,
  } as const;

  if (localView === "final" && finalResult) {
    return <FinalRevealView finalResult={finalResult} participantsMap={participantsMap} />;
  }

  if (localView === "score" && currentRound && role === "host" && hostToken) {
    return <ScoreInputView {...commonProps} hostToken={hostToken} currentRound={currentRound} />;
  }

  if (localView === "round" && currentRound) {
    return <RoundAnnounceView {...commonProps} currentRound={currentRound} />;
  }

  if (localView === "standings") {
    return <StandingsView {...commonProps} />;
  }

  return <ParticipantsView {...commonProps} />;
}
