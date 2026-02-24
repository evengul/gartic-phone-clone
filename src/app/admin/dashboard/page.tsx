"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { saveSessionToken } from "@/lib/session";

interface Game {
  id: number;
  code: string;
  status: string;
  currentRound: number;
  totalRounds: number | null;
  roundDurationSeconds: number;
  createdAt: string;
}

const STATUS_STYLE: Record<string, string> = {
  LOBBY: "bg-phase-lobby/20 text-phase-lobby border-phase-lobby",
  PLAYING: "bg-phase-playing/20 text-phase-playing border-phase-playing",
  REVEAL: "bg-phase-reveal/20 text-phase-reveal border-phase-reveal",
  VOTING: "bg-phase-voting/20 text-phase-voting border-phase-voting",
  RESULTS: "bg-phase-results/20 text-phase-results border-phase-results",
  ARCHIVED: "bg-retro-dark text-text-muted border-border-pixel",
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [roundDuration, setRoundDuration] = useState("120");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/games");
      if (res.status === 401) {
        router.push("/admin");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setGames(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const handleGameAction = async (code: string, action: "archive" | "delete") => {
    try {
      await fetch("/api/admin/games", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, action }),
      });
      await fetchGames();
    } catch {
      // ignore
    }
  };

  const handleCreate = async () => {
    const duration = Number(roundDuration);
    if (!Number.isInteger(duration) || duration <= 0) {
      setError("Rundetid må være et positivt heltall");
      return;
    }

    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundDurationSeconds: duration, nickname: nickname.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        saveSessionToken(data.code, data.sessionToken);
        await fetchGames();
        router.push(`/game/${data.code}`);
      }
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-base text-nes-purple leading-relaxed">
          Admin-panel
        </h1>
        <button
          onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            router.push("/admin");
          }}
          className="pixel-btn-sm bg-retro-surface text-text-muted hover:text-nes-red"
        >
          Logg ut
        </button>
      </div>

      {/* Create game */}
      <div className="pixel-card space-y-4">
        <h2 className="font-bold text-lg text-text-primary">Opprett nytt spill</h2>

        <input
          type="text"
          placeholder="Ditt kallenavn"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={20}
          className="pixel-input w-full max-w-xs"
        />

        <div className="flex items-center gap-4 flex-wrap">
          <label className="text-sm text-text-muted">
            Rundetid (sekunder):
          </label>
          <input
            type="number"
            value={roundDuration}
            onChange={(e) => setRoundDuration(e.target.value)}
            className="pixel-input w-24"
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={creating || !nickname.trim()}
          className="pixel-btn bg-nes-purple text-retro-white"
        >
          {creating ? "Oppretter..." : "Opprett spill"}
        </button>

        {error && <p className="text-sm text-nes-red font-bold">{error}</p>}
      </div>

      {/* Games */}
      <div>
        <h2 className="font-bold text-lg text-text-primary mb-3">Spill</h2>

        {loading ? (
          <p className="text-text-muted animate-blink">Laster...</p>
        ) : games.length === 0 ? (
          <p className="text-text-muted">Ingen spill ennå</p>
        ) : (
          <div className="space-y-2">
            {games.map((game) => (
              <div
                key={game.id}
                className={`pixel-card !p-4 flex items-center justify-between flex-wrap gap-2 ${
                  game.status === "ARCHIVED" ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-heading text-xs text-nes-yellow">
                    {game.code}
                  </span>
                  <span
                    className={`pixel-badge text-xs ${
                      STATUS_STYLE[game.status] ?? "bg-retro-dark text-text-muted"
                    }`}
                  >
                    {game.status}
                  </span>
                  {game.totalRounds && game.status !== "ARCHIVED" && game.status !== "RESULTS" && (
                    <span className="text-sm text-text-muted">
                      Runde {game.currentRound + 1}/{game.totalRounds}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {game.status !== "ARCHIVED" && game.status !== "RESULTS" && (
                    <a
                      href={`/game/${game.code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-nes-purple hover:text-nes-cyan transition-colors"
                    >
                      Åpne
                    </a>
                  )}
                  {game.status !== "ARCHIVED" && (
                    <button
                      onClick={() => handleGameAction(game.code, "archive")}
                      className="text-sm text-text-muted hover:text-nes-orange transition-colors"
                    >
                      Arkiver
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm(`Slette spill ${game.code}? Dette kan ikke angres.`)) {
                        handleGameAction(game.code, "delete");
                      }
                    }}
                    className="text-sm text-text-muted hover:text-nes-red transition-colors"
                  >
                    Slett
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
