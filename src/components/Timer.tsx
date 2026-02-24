"use client";

export function Timer({ secondsLeft }: { secondsLeft: number }) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isLow = secondsLeft <= 10;
  const isCritical = secondsLeft <= 5;

  return (
    <div
      className={`font-heading text-2xl inline-block px-4 py-2 pixel-border ${
        isCritical
          ? "text-nes-red animate-timer-pulse bg-nes-red/10 border-nes-red"
          : isLow
            ? "text-nes-red animate-timer-pulse bg-retro-surface"
            : "text-text-primary bg-retro-surface"
      }`}
    >
      {minutes}:{seconds.toString().padStart(2, "0")}
    </div>
  );
}
