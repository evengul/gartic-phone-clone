import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import {
  getGameByCode,
  getPlayersForGame,
  getRoundSubmissions,
  submitRoundEntry,
  advanceRound,
  setGameStatus,
} from "@/lib/db/queries";
import {
  getChainOwnerForPlayerInRound,
  getRoundType,
} from "@/lib/game-logic";
import { getPusher } from "@/lib/pusher/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const game = await getGameByCode(code);
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.status !== "PLAYING") {
    return NextResponse.json(
      { error: "Game is not in playing state" },
      { status: 400 }
    );
  }

  const gamePlayers = await getPlayersForGame(game.id);
  const totalPlayers = gamePlayers.length;
  const submissions = await getRoundSubmissions(game.id, game.currentRound);
  const submittedPlayerIds = new Set(submissions.map((s) => s.playerId));
  const type = getRoundType(game.currentRound);

  // Auto-submit blanks for players who haven't submitted
  for (const player of gamePlayers) {
    if (!submittedPlayerIds.has(player.id)) {
      const chainOwnerJoinOrder = getChainOwnerForPlayerInRound(
        player.joinOrder,
        game.currentRound,
        totalPlayers
      );
      const chainOwner = gamePlayers.find(
        (p) => p.joinOrder === chainOwnerJoinOrder
      );
      if (chainOwner) {
        await submitRoundEntry(
          game.id,
          game.currentRound,
          chainOwner.id,
          player.id,
          type,
          type === "TEXT" ? "(blank)" : ""
        );
      }
    }
  }

  const channel = `presence-game-${code.toUpperCase()}`;
  const nextRound = game.currentRound + 1;

  if (nextRound >= (game.totalRounds ?? totalPlayers)) {
    await setGameStatus(game.id, "REVEAL");
    await getPusher().trigger(channel, "phase-changed", {
      status: "REVEAL",
    });
  } else {
    await advanceRound(game.id, nextRound);
    await getPusher().trigger(channel, "round-started", {
      roundNumber: nextRound,
      type: getRoundType(nextRound),
    });
  }

  return NextResponse.json({ success: true });
}
