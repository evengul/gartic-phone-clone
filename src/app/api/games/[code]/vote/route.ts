import { NextRequest, NextResponse } from "next/server";
import { getPlayerFromRequest } from "@/lib/auth";
import {
  getGameByCode,
  getPlayersForGame,
  castVote,
  hasPlayerVoted,
  getVoteCount,
  getVoteResults,
  setGameStatus,
} from "@/lib/db/queries";
import { getPusher } from "@/lib/pusher/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { chainOwnerId } = await request.json();

  const game = await getGameByCode(code);
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.status !== "VOTING") {
    return NextResponse.json(
      { error: "Game is not in voting state" },
      { status: 400 }
    );
  }

  const player = await getPlayerFromRequest(code, game.id, request);
  if (!player) {
    return NextResponse.json({ error: "Not a player" }, { status: 401 });
  }

  if (chainOwnerId === player.id) {
    return NextResponse.json(
      { error: "Cannot vote for your own chain" },
      { status: 400 }
    );
  }

  const alreadyVoted = await hasPlayerVoted(game.id, player.id);
  if (alreadyVoted) {
    return NextResponse.json(
      { error: "Already voted" },
      { status: 400 }
    );
  }

  await castVote(game.id, player.id, chainOwnerId);

  const channel = `presence-game-${code.toUpperCase()}`;
  await getPusher().trigger(channel, "vote-cast", {
    voterId: player.id,
  });

  // Check if all players voted
  const gamePlayers = await getPlayersForGame(game.id);
  const totalVotes = await getVoteCount(game.id);

  if (totalVotes >= gamePlayers.length) {
    const results = await getVoteResults(game.id);
    await setGameStatus(game.id, "RESULTS");
    await getPusher().trigger(channel, "phase-changed", {
      status: "RESULTS",
    });
    await getPusher().trigger(channel, "results", { results });
  }

  return NextResponse.json({ success: true });
}
