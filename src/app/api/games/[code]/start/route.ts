import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getGameByCode, getPlayersForGame, startGame } from "@/lib/db/queries";
import { getRoundType } from "@/lib/game-logic";
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

  if (game.status !== "LOBBY") {
    return NextResponse.json(
      { error: "Game already started" },
      { status: 400 }
    );
  }

  const gamePlayers = await getPlayersForGame(game.id);
  if (gamePlayers.length < 2) {
    return NextResponse.json(
      { error: "Need at least 2 players" },
      { status: 400 }
    );
  }

  const totalRounds = gamePlayers.length;
  await startGame(game.id, totalRounds);

  const channel = `presence-game-${code.toUpperCase()}`;
  await getPusher().trigger(channel, "game-started", {
    totalRounds,
    roundDuration: game.roundDurationSeconds,
  });

  await getPusher().trigger(channel, "round-started", {
    roundNumber: 0,
    type: getRoundType(0),
  });

  return NextResponse.json({ success: true, totalRounds });
}
