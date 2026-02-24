import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getPlayerFromRequest } from "@/lib/auth";
import {
  getGameByCode,
  getPlayersForGame,
  getRoundSubmissions,
  getPreviousRoundContent,
  getVoteResults,
} from "@/lib/db/queries";
import {
  getChainOwnerForPlayerInRound,
  getRoundType,
} from "@/lib/game-logic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const game = await getGameByCode(code);
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const gamePlayers = await getPlayersForGame(game.id);
  const admin = await isAdmin();
  const player = await getPlayerFromRequest(code, game.id, request);

  let currentAssignment = null;
  let submittedThisRound = false;
  let submittedPlayerIds: number[] = [];

  if (game.status === "PLAYING" && player) {
    const totalPlayers = gamePlayers.length;
    const chainOwnerJoinOrder = getChainOwnerForPlayerInRound(
      player.joinOrder,
      game.currentRound,
      totalPlayers
    );
    const chainOwner = gamePlayers.find(
      (p) => p.joinOrder === chainOwnerJoinOrder
    );

    if (chainOwner) {
      const previousContent = await getPreviousRoundContent(
        game.id,
        game.currentRound,
        chainOwner.id
      );

      currentAssignment = {
        chainOwnerId: chainOwner.id,
        type: getRoundType(game.currentRound),
        previousContent,
      };
    }

    // Check if this player already submitted
    const submissions = await getRoundSubmissions(game.id, game.currentRound);
    submittedThisRound = submissions.some((s) => s.playerId === player.id);
    submittedPlayerIds = submissions.map((s) => s.playerId);
  }

  let postGameChoices: Record<number, string | null> | undefined;
  let voteResults = undefined;
  if (game.status === "RESULTS") {
    postGameChoices = {};
    for (const p of gamePlayers) {
      postGameChoices[p.id] = p.postGameChoice ?? null;
    }
    voteResults = await getVoteResults(game.id);
  }

  return NextResponse.json({
    game: {
      id: game.id,
      code: game.code,
      status: game.status,
      currentRound: game.currentRound,
      totalRounds: game.totalRounds,
      roundDurationSeconds: game.roundDurationSeconds,
      revealChainIndex: game.revealChainIndex,
    },
    players: gamePlayers.map((p) => ({
      id: p.id,
      gameId: p.gameId,
      nickname: p.nickname,
      joinOrder: p.joinOrder,
      isConnected: p.isConnected,
    })),
    myPlayer: player
      ? {
          id: player.id,
          gameId: player.gameId,
          nickname: player.nickname,
          joinOrder: player.joinOrder,
          isConnected: player.isConnected,
        }
      : null,
    isAdmin: admin,
    currentAssignment,
    submittedThisRound,
    submittedPlayerIds,
    postGameChoices,
    voteResults,
  });
}
