"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // If already authenticated, redirect straight to dashboard
  useEffect(() => {
    fetch("/api/admin/games").then((res) => {
      if (res.ok) {
        router.replace("/admin/dashboard");
      } else {
        setChecking(false);
      }
    }).catch(() => {
      setChecking(false);
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        setError("Ugyldig brukernavn eller passord");
        return;
      }

      router.push("/admin/dashboard");
    } catch {
      setError("Kunne ikke logge inn");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <p className="font-heading text-sm text-text-muted animate-blink">Laster...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in">
      <div className="pixel-card w-full max-w-sm space-y-6">
        <h1 className="font-heading text-lg text-center text-nes-purple leading-relaxed">
          Admin-innlogging
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Brukernavn"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="pixel-input w-full"
          />

          <input
            type="password"
            placeholder="Passord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pixel-input w-full"
          />

          <button
            type="submit"
            disabled={loading}
            className="pixel-btn w-full bg-nes-purple text-retro-white"
          >
            {loading ? "Logger inn..." : "Logg inn"}
          </button>

          {error && (
            <p className="text-sm text-nes-red text-center font-bold">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}
