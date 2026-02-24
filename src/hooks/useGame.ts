"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getPusherClient } from "@/lib/pusher/client";
import { gameFetch, getSessionToken, saveSessionToken } from "@/lib/session";
import type {
  GameState,
  Player,
  ChainRevealData,
  VoteResult,
  RoundType,
  PostGameChoice,
} from "@/types";

interface UseGameReturn {
  state: GameState | null;
  loading: boolean;
  error: string | null;
  revealedChains: ChainRevealData[];
  results: VoteResult[] | null;
  refresh: () => Promise<void>;
}

export function useGame(code: string): UseGameReturn {
  const [state, setState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealedChains, setRevealedChains] = useState<ChainRevealData[]>([]);
  const [results, setResults] = useState<VoteResult[] | null>(null);
  const subscribedRef = useRef(false);

  const fetchState = useCallback(async () => {
    try {
      const res = await gameFetch(code, `/api/games/${code}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to fetch game");
        return;
      }
      const data: GameState = await res.json();
      setState(data);
      if (data.voteResults) {
        setResults(data.voteResults);
      }
      setError(null);
    } catch {
      setError("Failed to connect");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Fetch all chains if we load into a phase that needs them (e.g. page reload during VOTING/RESULTS)
  const gameStatus = state?.game.status ?? null;
  useEffect(() => {
    if (
      (gameStatus === "VOTING" || gameStatus === "RESULTS") &&
      revealedChains.length === 0
    ) {
      gameFetch(code, `/api/games/${code}/chains`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.chains) {
            setRevealedChains(data.chains);
          }
        })
        .catch(() => {});
    }
  }, [gameStatus, code]);

  // Use a stable primitive for the dependency so we subscribe exactly once
  const myPlayerId = state?.myPlayer?.id ?? null;

  useEffect(() => {
    if (!myPlayerId) return;
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    const pusher = getPusherClient();
    const channelName = `presence-game-${code}`;
    const channel = pusher.subscribe(channelName);

    channel.bind("player-joined", (data: { player: Player }) => {
      setState((prev) => {
        if (!prev) return prev;
        if (prev.players.some((p) => p.id === data.player.id)) return prev;
        return { ...prev, players: [...prev.players, data.player] };
      });
    });

    channel.bind("player-kicked", (data: { playerId: number }) => {
      setState((prev) => {
        if (!prev) return prev;
        if (prev.myPlayer?.id === data.playerId) {
          window.location.href = "/?kicked=1";
          return prev;
        }
        return {
          ...prev,
          players: prev.players.filter((p) => p.id !== data.playerId),
        };
      });
    });

    channel.bind("game-started", () => {
      fetchState();
    });

    channel.bind(
      "round-started",
      () => {
        fetchState();
      }
    );

    channel.bind(
      "player-submitted",
      (data: { playerId: number; roundNumber: number }) => {
        setState((prev) => {
          if (!prev) return prev;
          if (prev.submittedPlayerIds.includes(data.playerId)) return prev;
          return {
            ...prev,
            submittedPlayerIds: [
              ...prev.submittedPlayerIds,
              data.playerId,
            ],
          };
        });
      }
    );

    channel.bind("phase-changed", () => {
      fetchState();
    });

    channel.bind(
      "reveal-chain",
      async (data: { chainOwnerId: number; ownerNickname: string }) => {
        try {
          const res = await gameFetch(
            code,
            `/api/games/${code}/chain?chainOwnerId=${data.chainOwnerId}`
          );
          if (res.ok) {
            const { entries } = await res.json();
            setRevealedChains((prev) => [
              ...prev,
              {
                chainOwnerId: data.chainOwnerId,
                ownerNickname: data.ownerNickname,
                entries,
              },
            ]);
          }
        } catch {
          // ignore fetch errors
        }
      }
    );

    channel.bind("vote-cast", () => {
      // Visual update only
    });

    channel.bind("results", (data: { results: VoteResult[] }) => {
      setResults(data.results);
    });

    channel.bind(
      "post-game-choice",
      (data: { playerId: number; choice: PostGameChoice }) => {
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            postGameChoices: {
              ...prev.postGameChoices,
              [data.playerId]: data.choice,
            },
          };
        });
      }
    );

    channel.bind("game-ended", () => {
      window.location.href = "/?ended=1";
    });

    channel.bind("rematch-created", (data: { newCode: string }) => {
      setState((prev) => {
        const myChoice = prev?.postGameChoices?.[myPlayerId ?? -1];
        if (myChoice === "play_again") {
          const oldToken = getSessionToken(code);
          if (oldToken) {
            saveSessionToken(data.newCode, oldToken);
          }
          window.location.href = `/game/${data.newCode}`;
        } else {
          window.location.href = "/";
        }
        return prev;
      });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      subscribedRef.current = false;
    };
  }, [code, myPlayerId, fetchState]);

  return { state, loading, error, revealedChains, results, refresh: fetchState };
}
