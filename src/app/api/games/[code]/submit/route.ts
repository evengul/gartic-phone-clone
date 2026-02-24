import { NextRequest, NextResponse } from "next/server";
import { getPlayerFromRequest } from "@/lib/auth";
import {
  getGameByCode,
  getPlayersForGame,
  submitRoundEntry,
  getRoundSubmissions,
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
  const { content } = await request.json();

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

  const player = await getPlayerFromRequest(code, game.id, request);
  if (!player) {
    return NextResponse.json({ error: "Not a player" }, { status: 401 });
  }

  const gamePlayers = await getPlayersForGame(game.id);
  const totalPlayers = gamePlayers.length;

  // Determine which chain this player is working on
  const chainOwnerJoinOrder = getChainOwnerForPlayerInRound(
    player.joinOrder,
    game.currentRound,
    totalPlayers
  );
  const chainOwner = gamePlayers.find(
    (p) => p.joinOrder === chainOwnerJoinOrder
  );

  if (!chainOwner) {
    return NextResponse.json({ error: "Invalid chain" }, { status: 500 });
  }

  // Check if already submitted
  const existingSubmissions = await getRoundSubmissions(
    game.id,
    game.currentRound
  );
  if (existingSubmissions.some((s) => s.playerId === player.id)) {
    return NextResponse.json(
      { error: "Already submitted" },
      { status: 400 }
    );
  }

  const type = getRoundType(game.currentRound);
  await submitRoundEntry(
    game.id,
    game.currentRound,
    chainOwner.id,
    player.id,
    type,
    content || (type === "TEXT" ? "(blank)" : "")
  );

  const channel = `presence-game-${code.toUpperCase()}`;

  // Notify others
  await getPusher().trigger(channel, "player-submitted", {
    playerId: player.id,
    roundNumber: game.currentRound,
  });

  // Check if all players submitted
  const allSubmissions = await getRoundSubmissions(
    game.id,
    game.currentRound
  );

  if (allSubmissions.length >= totalPlayers) {
    const nextRound = game.currentRound + 1;

    if (nextRound >= (game.totalRounds ?? totalPlayers)) {
      // All rounds complete - move to reveal
      await setGameStatus(game.id, "REVEAL");
      await getPusher().trigger(channel, "phase-changed", {
        status: "REVEAL",
      });
    } else {
      // Advance to next round
      await advanceRound(game.id, nextRound);
      await getPusher().trigger(channel, "round-started", {
        roundNumber: nextRound,
        type: getRoundType(nextRound),
      });
    }
  }

  return NextResponse.json({ success: true });
}
