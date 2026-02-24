"use client";

import type { Player } from "@/types";

interface PlayerListProps {
  players: Player[];
  submittedIds?: number[];
  showStatus?: boolean;
}

export function PlayerList({
  players,
  submittedIds = [],
  showStatus = false,
}: PlayerListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {players.map((player) => {
        const submitted = showStatus && submittedIds.includes(player.id);
        return (
          <div
            key={player.id}
            className={`pixel-badge ${
              submitted
                ? "border-nes-green bg-nes-green/20 text-nes-green"
                : ""
            }`}
          >
            {player.nickname}
            {submitted && " \u2713"}
          </div>
        );
      })}
    </div>
  );
}
