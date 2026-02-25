"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveSessionToken } from "@/lib/session";

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState(searchParams.get("code")?.toUpperCase() ?? "");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !roomCode.trim()) return;

    setJoining(true);
    setError("");

    try {
      const code = roomCode.trim().toUpperCase();
      const res = await fetch(`/api/games/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Kunne ikke bli med");
        return;
      }

      const data = await res.json();
      saveSessionToken(code, data.sessionToken);
      router.push(`/game/${code}`);
    } catch {
      setError("Kunne ikke bli med i spillet");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in">
      <div className="pixel-card w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-heading text-2xl leading-relaxed">
            <span className="text-text-primary">Gartic</span>{" "}
            <span className="text-nes-yellow">Phone</span>
          </h1>
          <p className="text-text-muted text-sm">Tegn, gjett og le med venner</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <input
            type="text"
            placeholder="Ditt kallenavn"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            className="pixel-input w-full"
          />

          <input
            type="text"
            placeholder="Romkode"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="pixel-input w-full font-heading text-sm tracking-widest text-center uppercase"
          />

          <button
            type="submit"
            disabled={joining || !nickname.trim() || !roomCode.trim()}
            className="pixel-btn w-full bg-btn-primary text-retro-white"
          >
            {joining ? "Kobler til..." : "Bli med"}
          </button>

          {error && (
            <p className="text-sm text-nes-red text-center font-bold">{error}</p>
          )}
        </form>
      </div>

      <a
        href="/admin"
        className="mt-8 text-sm text-text-muted hover:text-nes-cyan transition-colors"
      >
        Admin
      </a>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <JoinForm />
    </Suspense>
  );
}
