"use client";

import { useState } from "react";
import { gameFetch } from "@/lib/session";
import type { VoteResult, Player, PostGameChoice } from "@/types";

interface ResultsProps {
  results: VoteResult[];
  isAdmin: boolean;
  myPlayer: Player | null;
  players: Player[];
  postGameChoices?: Record<number, PostGameChoice>;
  gameCode: string;
}

export function Results({
  results,
  isAdmin,
  myPlayer,
  players,
  postGameChoices = {},
  gameCode,
}: ResultsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const myChoice = myPlayer ? postGameChoices[myPlayer.id] ?? null : null;

  const playAgainList = players.filter(
    (p) => postGameChoices[p.id] === "play_again"
  );
  const exitList = players.filter(
    (p) => postGameChoices[p.id] === "exit"
  );
  const undecidedList = players.filter(
    (p) => !postGameChoices[p.id]
  );

  const handleChoice = async (choice: "play_again" | "exit") => {
    setLoading(true);
    setError("");
    try {
      const res = await gameFetch(
        gameCode,
        `/api/games/${gameCode}/post-game-choice`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ choice }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Feilet");
      }
      if (choice === "exit") {
        window.location.href = "/";
      }
    } catch {
      setError("Kunne ikke sende valg");
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAgain = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await gameFetch(
        gameCode,
        `/api/games/${gameCode}/play-again`,
        { method: "POST" }
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Kunne ikke opprette omkamp");
      }
    } catch {
      setError("Kunne ikke opprette omkamp");
    } finally {
      setLoading(false);
    }
  };

  const handleQuit = async () => {
    setLoading(true);
    try {
      await gameFetch(gameCode, `/api/games/${gameCode}/quit`, {
        method: "POST",
      });
    } catch {
      setError("Kunne ikke avslutte spillet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-lg mx-auto animate-fade-in">
      <h2 className="font-heading text-lg text-center text-phase-results leading-relaxed">
        Resultater
      </h2>

      <div className="space-y-3">
        {results.map((result, i) => {
          const rank =
            i === 0 || result.voteCount < results[i - 1].voteCount
              ? i + 1
              : results
                  .slice(0, i)
                  .findIndex((r) => r.voteCount === result.voteCount) + 1;
          const isFirst = rank === 1;
          return (
            <div
              key={result.chainOwnerId}
              className={`pixel-card flex items-center gap-4 ${
                isFirst
                  ? "border-nes-yellow bg-nes-yellow/10 animate-gold-glow"
                  : ""
              }`}
            >
              <div
                className={`font-heading text-xl ${
                  isFirst ? "text-nes-yellow" : "text-text-muted"
                }`}
              >
                #{rank}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-text-primary">
                  {result.ownerNickname}
                </p>
                {result.voters.length > 0 && (
                  <p className="text-sm text-text-muted truncate">
                    Stemt av: {result.voters.join(", ")}
                  </p>
                )}
              </div>
              <div className="font-heading text-sm text-text-primary shrink-0">
                {result.voteCount}
              </div>
            </div>
          );
        })}
      </div>

      {/* Post-game section */}
      <div className="border-t-4 border-border-pixel pt-6 space-y-4">
        <h3 className="font-heading text-xs text-center text-text-primary leading-relaxed">
          Hva nå?
        </h3>

        {/* Player choice buttons */}
        {myPlayer && !myChoice && (
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => handleChoice("play_again")}
              disabled={loading}
              className="pixel-btn bg-btn-success text-retro-white"
            >
              Spill igjen
            </button>
            <button
              onClick={() => handleChoice("exit")}
              disabled={loading}
              className="pixel-btn bg-retro-surface text-text-muted"
            >
              Avslutt
            </button>
          </div>
        )}

        {myPlayer && myChoice === "play_again" && (
          <p className="text-center text-nes-green font-bold">
            Du valgte å spille igjen!
            {!isAdmin && " Venter på admin..."}
          </p>
        )}

        {/* Admin actions */}
        {isAdmin && (
          <div className="flex gap-3 justify-center">
            <button
              onClick={handlePlayAgain}
              disabled={loading || playAgainList.length < 2}
              className="pixel-btn bg-btn-primary text-retro-white"
              title={
                playAgainList.length < 2
                  ? "Trenger minst 2 spillere"
                  : undefined
              }
            >
              Nytt spill ({playAgainList.length})
            </button>
            <button
              onClick={handleQuit}
              disabled={loading}
              className="pixel-btn bg-btn-danger text-retro-white"
            >
              Avslutt spill
            </button>
          </div>
        )}

        {/* Real-time choice list */}
        <div className="space-y-2">
          {playAgainList.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {playAgainList.map((p) => (
                <span
                  key={p.id}
                  className="pixel-badge border-nes-green bg-nes-green/20 text-nes-green"
                >
                  {p.nickname} - Spill igjen
                </span>
              ))}
            </div>
          )}
          {exitList.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {exitList.map((p) => (
                <span
                  key={p.id}
                  className="pixel-badge border-nes-red bg-nes-red/20 text-nes-red"
                >
                  {p.nickname} - Forlater
                </span>
              ))}
            </div>
          )}
          {undecidedList.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {undecidedList.map((p) => (
                <span
                  key={p.id}
                  className="pixel-badge animate-blink"
                >
                  {p.nickname} - Velger...
                </span>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-nes-red text-center font-bold">{error}</p>}
      </div>
    </div>
  );
}
