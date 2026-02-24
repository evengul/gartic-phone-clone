import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import {
  getGameByCode,
  getPlayersForGame,
  advanceReveal,
  setGameStatus,
} from "@/lib/db/queries";
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

  if (game.status !== "REVEAL") {
    return NextResponse.json(
      { error: "Game is not in reveal state" },
      { status: 400 }
    );
  }

  const gamePlayers = await getPlayersForGame(game.id);
  const currentIndex = game.revealChainIndex;

  if (currentIndex >= gamePlayers.length) {
    // All chains revealed, move to voting
    await setGameStatus(game.id, "VOTING");
    const channel = `presence-game-${code.toUpperCase()}`;
    await getPusher().trigger(channel, "phase-changed", {
      status: "VOTING",
    });
    return NextResponse.json({ success: true, phase: "VOTING" });
  }

  const chainOwner = gamePlayers[currentIndex];

  const channel = `presence-game-${code.toUpperCase()}`;
  await getPusher().trigger(channel, "reveal-chain", {
    chainOwnerId: chainOwner.id,
    ownerNickname: chainOwner.nickname,
  });

  // Advance the index for next call
  await advanceReveal(game.id);

  return NextResponse.json({
    success: true,
    chainOwnerId: chainOwner.id,
    remaining: gamePlayers.length - currentIndex - 1,
  });
}
