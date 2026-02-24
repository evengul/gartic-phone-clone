"use client";

import { useState, useCallback, useEffect } from "react";
import { useGame } from "@/hooks/useGame";
import { useTimer } from "@/hooks/useTimer";
import { gameFetch } from "@/lib/session";
import { Lobby } from "./Lobby";
import { TextPrompt } from "./TextPrompt";
import { Canvas } from "./Canvas";
import { ChainReveal } from "./ChainReveal";
import { VotingPanel } from "./VotingPanel";
import { Results } from "./Results";
import { Timer } from "./Timer";
import { PlayerList } from "./PlayerList";
import { ToastContainer, useToast } from "./Toast";

interface GameViewProps {
  code: string;
}

const PHASE_BORDER_COLOR: Record<string, string> = {
  LOBBY: "border-t-phase-lobby",
  PLAYING: "border-t-phase-playing",
  REVEAL: "border-t-phase-reveal",
  VOTING: "border-t-phase-voting",
  RESULTS: "border-t-phase-results",
};

export function GameView({ code }: GameViewProps) {
  const { state, loading, error, revealedChains, results, refresh } =
    useGame(code);
  const [submitted, setSubmitted] = useState(false);
  const [revealLoading, setRevealLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [forcingRound, setForcingRound] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toasts, showToast } = useToast();

  const handleSubmit = useCallback(
    async (content: string) => {
      try {
        const res = await gameFetch(code, `/api/games/${code}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (res.ok) {
          setSubmitted(true);
        }
      } catch {
        // ignore
      }
    },
    [code]
  );

  const handleTimerExpire = useCallback(() => {
    if (!submitted && state?.currentAssignment) {
      const blankContent =
        state.currentAssignment.type === "TEXT" ? "(tomt)" : "";
      handleSubmit(blankContent);
    }
  }, [submitted, state?.currentAssignment, handleSubmit]);

  const timer = useTimer(
    state?.game.roundDurationSeconds ?? 60,
    handleTimerExpire
  );

  // Reset submitted state and restart timer when a new round begins
  useEffect(() => {
    if (state?.game.status === "PLAYING") {
      setSubmitted(false);
      timer.start();
    }
  }, [state?.game.currentRound, state?.game.status]);

  // Stop timer when player submits
  useEffect(() => {
    if (submitted) {
      timer.stop();
    }
  }, [submitted]);

  const handleForceNextRound = async () => {
    setForcingRound(true);
    try {
      await gameFetch(code, `/api/games/${code}/force-next-round`, {
        method: "POST",
      });
    } finally {
      setForcingRound(false);
    }
  };

  const handleNextReveal = async () => {
    setRevealLoading(true);
    try {
      await gameFetch(code, `/api/games/${code}/next-reveal`, {
        method: "POST",
      });
    } finally {
      setRevealLoading(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      showToast("Romkode kopiert!");
    } catch {
      // fallback: do nothing
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="font-heading text-sm text-text-muted animate-blink">Laster...</p>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-nes-red font-bold">{error || "Noe gikk galt"}</p>
      </div>
    );
  }

  const { game, players, myPlayer, isAdmin, currentAssignment } = state;
  const isSubmitted = submitted || state.submittedThisRound;
  const phaseBorder = PHASE_BORDER_COLOR[game.status] ?? "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`pixel-card !p-3 border-t-4 ${phaseBorder}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">Rom:</span>
            <button
              onClick={handleCopyCode}
              className="font-heading text-xs text-nes-yellow hover:text-nes-cyan transition-colors cursor-pointer"
              title="Klikk for å kopiere"
            >
              {code}
            </button>
          </div>
          <div className="flex items-center gap-3">
            {myPlayer && (
              <span className="text-sm text-text-muted">
                {myPlayer.nickname}
              </span>
            )}
            {isAdmin && (
              <span className="pixel-badge bg-nes-purple/20 border-nes-purple text-nes-purple text-xs">
                Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Game phases */}
      {game.status === "LOBBY" && <Lobby state={state} />}

      {game.status === "PLAYING" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">
              Runde {game.currentRound + 1} av {game.totalRounds}
            </p>
            {timer.isRunning && <Timer secondsLeft={timer.secondsLeft} />}
          </div>

          <PlayerList
            players={players}
            submittedIds={state.submittedPlayerIds}
            showStatus
          />

          {isAdmin && (
            <div className="flex justify-end">
              <button
                onClick={handleForceNextRound}
                disabled={forcingRound}
                className="pixel-btn-sm bg-retro-surface text-text-muted hover:text-nes-red hover:border-nes-red"
              >
                {forcingRound ? "Hopper over..." : "Tving neste runde"}
              </button>
            </div>
          )}

          {isSubmitted ? (
            <div className="text-center py-12">
              <p className="font-heading text-sm text-phase-playing leading-relaxed">
                Sendt inn!
              </p>
              <p className="text-sm text-text-muted mt-2 animate-blink">
                Venter på andre spillere...
              </p>
            </div>
          ) : currentAssignment?.type === "TEXT" ? (
            <TextPrompt
              prompt={currentAssignment.previousContent}
              roundNumber={game.currentRound}
              onSubmit={handleSubmit}
            />
          ) : currentAssignment?.type === "DRAWING" ? (
            <Canvas
              prompt={currentAssignment.previousContent}
              onSubmit={handleSubmit}
            />
          ) : null}
        </div>
      )}

      {game.status === "REVEAL" && (
        <ChainReveal
          chains={revealedChains}
          isAdmin={isAdmin}
          onNextChain={handleNextReveal}
          loading={revealLoading}
        />
      )}

      {game.status === "VOTING" && myPlayer && (
        <VotingPanel
          chains={revealedChains}
          myPlayerId={myPlayer.id}
          gameCode={game.code}
          hasVoted={hasVoted}
          onVoted={() => setHasVoted(true)}
        />
      )}

      {game.status === "RESULTS" && results && (
        <Results
          results={results}
          isAdmin={isAdmin}
          myPlayer={myPlayer ?? null}
          players={players}
          postGameChoices={state.postGameChoices}
          gameCode={game.code}
        />
      )}

      {game.status === "VOTING" && isAdmin && !myPlayer && (
        <div className="text-center py-8">
          <p className="text-text-muted animate-blink">
            Spillerne stemmer...
          </p>
        </div>
      )}

      {game.status === "RESULTS" && !results && (
        <div className="text-center py-8">
          <p className="text-text-muted animate-blink">Laster resultater...</p>
        </div>
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}
