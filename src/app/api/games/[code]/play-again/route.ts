import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import {
  getGameByCode,
  getPlayersForGame,
  createRematchGame,
} from "@/lib/db/queries";
import { createRoomCode } from "@/lib/utils";
import { getPusher } from "@/lib/pusher/server";

export async function POST(
  _request: NextRequest,
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

  if (game.status !== "RESULTS") {
    return NextResponse.json(
      { error: "Can only rematch from results" },
      { status: 400 }
    );
  }

  const allPlayers = await getPlayersForGame(game.id);
  const playAgainCount = allPlayers.filter(
    (p) => p.postGameChoice === "play_again"
  ).length;

  if (playAgainCount < 2) {
    return NextResponse.json(
      { error: "Need at least 2 players to play again" },
      { status: 400 }
    );
  }

  const newCode = createRoomCode();
  const newGame = await createRematchGame(
    game.id,
    newCode,
    game.roundDurationSeconds
  );

  const channel = `presence-game-${code.toUpperCase()}`;
  await getPusher().trigger(channel, "rematch-created", {
    newCode: newGame.code,
  });

  return NextResponse.json({ success: true, newCode: newGame.code });
}
