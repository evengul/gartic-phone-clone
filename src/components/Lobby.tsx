"use client";

import type { GameState } from "@/types";
import { useState } from "react";
import { gameFetch } from "@/lib/session";

interface LobbyProps {
  state: GameState;
}

export function Lobby({ state }: LobbyProps) {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleStart = async () => {
    setStarting(true);
    setError("");
    try {
      const res = await gameFetch(state.game.code, `/api/games/${state.game.code}/start`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Kunne ikke starte");
      }
    } catch {
      setError("Kunne ikke starte spillet");
    } finally {
      setStarting(false);
    }
  };

  const handleKick = async (playerId: number) => {
    try {
      await gameFetch(state.game.code, `/api/games/${state.game.code}/kick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
    } catch {
      // ignore
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(state.game.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: do nothing
    }
  };

  return (
    <div className="text-center space-y-6 animate-fade-in">
      <div>
        <p className="text-sm text-text-muted mb-2">Romkode</p>
        <div className="flex items-center justify-center gap-3">
          <p className="font-heading text-3xl text-nes-yellow animate-shimmer">
            {state.game.code}
          </p>
          <button
            onClick={handleCopyCode}
            className="pixel-btn-sm bg-retro-surface text-text-muted hover:text-nes-cyan"
            title="Kopier romkode"
          >
            {copied ? "\u2713" : "\u2398"}
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm text-text-muted mb-3">
          Spillere ({state.players.length}/8)
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {state.players.map((player) => (
            <div
              key={player.id}
              className="pixel-badge animate-pop-in"
            >
              {player.nickname}
              {state.isAdmin && player.id !== state.myPlayer?.id && (
                <button
                  onClick={() => handleKick(player.id)}
                  className="ml-2 text-text-muted hover:text-nes-red transition-colors"
                  title={`Spark ${player.nickname}`}
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {state.players.length < 2 && (
        <p className="text-sm text-text-muted animate-blink">
          Venter på minst 2 spillere...
        </p>
      )}

      {state.isAdmin && state.players.length >= 2 && (
        <button
          onClick={handleStart}
          disabled={starting}
          className="pixel-btn bg-btn-success text-retro-white"
        >
          {starting ? "Starter..." : "Start spill"}
        </button>
      )}

      {!state.isAdmin && (
        <p className="text-sm text-text-muted animate-blink">
          Venter på at admin starter spillet...
        </p>
      )}

      {error && <p className="text-sm text-nes-red font-bold">{error}</p>}
    </div>
  );
}
