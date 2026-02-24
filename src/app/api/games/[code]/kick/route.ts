import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getGameByCode, getPlayersForGame, removePlayer } from "@/lib/db/queries";
import { getPusher } from "@/lib/pusher/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { playerId } = await request.json();

  const game = await getGameByCode(code);
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.status !== "LOBBY") {
    return NextResponse.json(
      { error: "Can only kick players in the lobby" },
      { status: 400 }
    );
  }

  const gamePlayers = await getPlayersForGame(game.id);
  const player = gamePlayers.find((p) => p.id === playerId);

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  await removePlayer(playerId);

  const channel = `presence-game-${code.toUpperCase()}`;
  await getPusher().trigger(channel, "player-kicked", {
    playerId,
    nickname: player.nickname,
  });

  return NextResponse.json({ success: true });
}
