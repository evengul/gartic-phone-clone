import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getGameByCode, getPlayersForGame, addPlayer } from "@/lib/db/queries";
import { createSessionToken } from "@/lib/utils";
import { getPusher } from "@/lib/pusher/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { nickname } = await request.json();

  if (!nickname || nickname.trim().length === 0) {
    return NextResponse.json(
      { error: "Nickname is required" },
      { status: 400 }
    );
  }

  const game = await getGameByCode(code);
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.status !== "LOBBY") {
    return NextResponse.json(
      { error: "Game has already started" },
      { status: 400 }
    );
  }

  const existingPlayers = await getPlayersForGame(game.id);

  if (existingPlayers.length >= 8) {
    return NextResponse.json({ error: "Game is full" }, { status: 400 });
  }

  const nameTaken = existingPlayers.some(
    (p) => p.nickname.toLowerCase() === nickname.trim().toLowerCase()
  );
  if (nameTaken) {
    return NextResponse.json(
      { error: "Nickname already taken" },
      { status: 400 }
    );
  }

  const sessionToken = createSessionToken();
  const player = await addPlayer(game.id, nickname.trim(), sessionToken);

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set(`gartic-session-${code.toUpperCase()}`, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  // Notify other players via Pusher
  await getPusher().trigger(`presence-game-${code.toUpperCase()}`, "player-joined", {
    player: {
      id: player.id,
      gameId: player.gameId,
      nickname: player.nickname,
      joinOrder: player.joinOrder,
      isConnected: true,
    },
  });

  return NextResponse.json({
    playerId: player.id,
    nickname: player.nickname,
    sessionToken,
  });
}
