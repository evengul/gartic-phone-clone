"use client";

import { useState } from "react";
import type { ChainRevealData } from "@/types";
import { gameFetch } from "@/lib/session";

interface VotingPanelProps {
  chains: ChainRevealData[];
  myPlayerId: number;
  gameCode: string;
  hasVoted: boolean;
  onVoted: () => void;
}

export function VotingPanel({
  chains,
  myPlayerId,
  gameCode,
  hasVoted,
  onVoted,
}: VotingPanelProps) {
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");

  const handleVote = async (chainOwnerId: number) => {
    setVoting(true);
    setError("");
    try {
      const res = await gameFetch(gameCode, `/api/games/${gameCode}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chainOwnerId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Kunne ikke stemme");
      } else {
        onVoted();
      }
    } catch {
      setError("Kunne ikke stemme");
    } finally {
      setVoting(false);
    }
  };

  if (hasVoted) {
    return (
      <div className="text-center py-8 animate-fade-in">
        <p className="font-heading text-sm text-phase-voting leading-relaxed">
          Stemme sendt!
        </p>
        <p className="text-sm text-text-muted mt-2 animate-blink">
          Venter på at alle stemmer...
        </p>
      </div>
    );
  }

  // Filter out player's own chain
  const votableChains = chains.filter(
    (c) => c.chainOwnerId !== myPlayerId
  );

  return (
    <div className="space-y-6 w-full max-w-2xl mx-auto animate-fade-in">
      <h2 className="font-heading text-base text-center text-phase-voting leading-relaxed">
        Stem på den beste kjeden
      </h2>

      <div className="grid gap-6">
        {votableChains.map((chain) => (
          <div
            key={chain.chainOwnerId}
            className="pixel-card transition-transform hover:-translate-y-1"
          >
            <div className="pb-3 mb-3 border-b-2 border-border-pixel">
              <p className="font-heading text-xs text-text-primary leading-relaxed">
                {chain.ownerNickname} sin kjede
              </p>
            </div>

            <div className="overflow-x-auto pb-2">
              <div className="flex items-center gap-2">
                {chain.entries.map((entry, i) => (
                  <div key={entry.id} className="flex items-center gap-2 shrink-0">
                    {i > 0 && (
                      <span className="text-xl text-text-muted font-bold">&rarr;</span>
                    )}
                    {entry.type === "TEXT" ? (
                      <span className="text-sm text-retro-cream whitespace-nowrap px-2 py-1 bg-retro-dark pixel-border">
                        &ldquo;{entry.content}&rdquo;
                      </span>
                    ) : entry.content ? (
                      <img
                        src={entry.content}
                        alt="Tegning"
                        className="w-24 pixel-border bg-white"
                      />
                    ) : (
                      <div className="w-24 aspect-square pixel-border bg-white flex items-center justify-center">
                        <span className="text-[10px] text-text-muted italic text-center px-1">Ingen tegning</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleVote(chain.chainOwnerId)}
              disabled={voting}
              className="pixel-btn w-full bg-phase-voting text-retro-white mt-3"
            >
              Stem på denne kjeden
            </button>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-nes-red text-center font-bold">{error}</p>}
    </div>
  );
}
