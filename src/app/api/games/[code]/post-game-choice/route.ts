import { NextRequest, NextResponse } from "next/server";
import { getPlayerFromRequest } from "@/lib/auth";
import { getGameByCode, setPostGameChoice } from "@/lib/db/queries";
import { getPusher } from "@/lib/pusher/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { choice } = await request.json();

  if (!["play_again", "exit"].includes(choice)) {
    return NextResponse.json({ error: "Invalid choice" }, { status: 400 });
  }

  const game = await getGameByCode(code);
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.status !== "RESULTS") {
    return NextResponse.json(
      { error: "Game is not in results phase" },
      { status: 400 }
    );
  }

  const player = await getPlayerFromRequest(code, game.id, request);
  if (!player) {
    return NextResponse.json({ error: "Not a player" }, { status: 401 });
  }

  await setPostGameChoice(player.id, choice);

  const channel = `presence-game-${code.toUpperCase()}`;
  await getPusher().trigger(channel, "post-game-choice", {
    playerId: player.id,
    nickname: player.nickname,
    choice,
  });

  return NextResponse.json({ success: true });
}
