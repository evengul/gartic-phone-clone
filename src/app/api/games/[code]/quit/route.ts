import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getGameByCode, setGameStatus } from "@/lib/db/queries";
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
      { error: "Can only quit from results" },
      { status: 400 }
    );
  }

  await setGameStatus(game.id, "ARCHIVED");

  const channel = `presence-game-${code.toUpperCase()}`;
  await getPusher().trigger(channel, "game-ended", {});

  return NextResponse.json({ success: true });
}
