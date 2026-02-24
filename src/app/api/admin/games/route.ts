import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAdmin } from "@/lib/auth";
import { createGame, addPlayer, getAllGames, setGameStatus, deleteGame, getGameByCode } from "@/lib/db/queries";
import { createRoomCode, createSessionToken } from "@/lib/utils";

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roundDurationSeconds = 60, nickname } = await request.json();

  if (!nickname || nickname.trim().length === 0) {
    return NextResponse.json(
      { error: "Nickname is required" },
      { status: 400 }
    );
  }

  const code = createRoomCode();
  const game = await createGame(code, roundDurationSeconds);

  // Auto-join admin as first player
  const sessionToken = createSessionToken();
  await addPlayer(game.id, nickname.trim(), sessionToken);

  const cookieStore = await cookies();
  cookieStore.set(`gartic-session-${code}`, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return NextResponse.json({ code: game.code, id: game.id, sessionToken });
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allGames = await getAllGames();
  return NextResponse.json(allGames);
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code, action } = await request.json();
  const game = await getGameByCode(code);
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (action === "archive") {
    await setGameStatus(game.id, "ARCHIVED");
    return NextResponse.json({ success: true });
  }

  if (action === "delete") {
    await deleteGame(game.id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
