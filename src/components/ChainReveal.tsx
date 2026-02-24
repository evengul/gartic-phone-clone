"use client";

import { useState, useEffect, useRef } from "react";
import type { ChainRevealData } from "@/types";
import { DrawingViewer } from "./DrawingViewer";

interface ChainRevealProps {
  chains: ChainRevealData[];
  isAdmin: boolean;
  onNextChain: () => void;
  loading?: boolean;
}

const REVEAL_DELAY_MS = 5000;

export function ChainReveal({
  chains,
  isAdmin,
  onNextChain,
  loading,
}: ChainRevealProps) {
  const currentChain = chains[chains.length - 1];
  const [visibleCount, setVisibleCount] = useState(0);
  const prevChainIdRef = useRef<number | null>(null);

  // When a new chain arrives, reset and start revealing entries one by one
  useEffect(() => {
    if (!currentChain) return;

    const chainId = currentChain.chainOwnerId;
    if (chainId === prevChainIdRef.current) return;
    prevChainIdRef.current = chainId;

    // Show first entry immediately
    setVisibleCount(1);

    const totalEntries = currentChain.entries.length;
    if (totalEntries <= 1) return;

    let count = 1;
    const interval = setInterval(() => {
      count++;
      setVisibleCount(count);
      if (count >= totalEntries) {
        clearInterval(interval);
      }
    }, REVEAL_DELAY_MS);

    return () => clearInterval(interval);
  }, [currentChain]);

  const allRevealed = currentChain
    ? visibleCount >= currentChain.entries.length
    : true;

  return (
    <div className="space-y-6 w-full max-w-2xl mx-auto animate-fade-in">
      <h2 className="font-heading text-lg text-center text-phase-reveal leading-relaxed">
        Kjede-avsløring
      </h2>

      {chains.length === 0 ? (
        <div className="text-center">
          <p className="text-text-muted">
            {isAdmin
              ? 'Klikk "Vis første kjede" for å starte!'
              : "Venter på at admin avslører kjedene..."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-center text-sm text-text-muted">
            {currentChain.ownerNickname} sin kjede
          </p>

          {currentChain.entries.slice(0, visibleCount).map((entry, i) => (
            <div
              key={entry.id}
              className="pixel-card animate-pixel-reveal"
            >
              <p className="text-xs text-text-muted mb-2">
                Runde {i + 1} &mdash; {entry.playerNickname}
              </p>
              {entry.type === "TEXT" ? (
                <p className="text-lg text-retro-cream font-bold">
                  &ldquo;{entry.content}&rdquo;
                </p>
              ) : (
                <DrawingViewer dataUrl={entry.content} />
              )}
            </div>
          ))}

          {!allRevealed && (
            <p className="text-center text-sm text-text-muted animate-blink">
              Neste bidrag om et øyeblikk...
            </p>
          )}
        </div>
      )}

      {isAdmin && (
        <div className="text-center">
          <button
            onClick={onNextChain}
            disabled={loading || !allRevealed}
            className="pixel-btn bg-nes-orange text-retro-white"
          >
            {loading
              ? "Laster..."
              : chains.length === 0
                ? "Vis første kjede"
                : "Vis neste kjede"}
          </button>
        </div>
      )}
    </div>
  );
}
