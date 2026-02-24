import { db } from ".";
import { games, players, rounds, votes } from "./schema";
import { eq, and, count, sql } from "drizzle-orm";

export async function createGame(code: string, roundDuration: number) {
  const result = await db
    .insert(games)
    .values({ code, roundDurationSeconds: roundDuration })
    .returning();
  return result[0];
}

export async function getGameByCode(code: string) {
  const result = await db
    .select()
    .from(games)
    .where(eq(games.code, code.toUpperCase()))
    .limit(1);
  return result[0] ?? null;
}

export async function addPlayer(
  gameId: number,
  nickname: string,
  sessionToken: string
) {
  // Get next join order
  const countResult = await db
    .select({ count: count() })
    .from(players)
    .where(eq(players.gameId, gameId));
  const joinOrder = countResult[0].count;

  const result = await db
    .insert(players)
    .values({ gameId, nickname, joinOrder, sessionToken })
    .returning();
  return result[0];
}

export async function getPlayerBySessionToken(
  gameId: number,
  token: string
) {
  const result = await db
    .select()
    .from(players)
    .where(and(eq(players.gameId, gameId), eq(players.sessionToken, token)))
    .limit(1);
  return result[0] ?? null;
}

export async function getPlayersForGame(gameId: number) {
  return db
    .select()
    .from(players)
    .where(eq(players.gameId, gameId))
    .orderBy(players.joinOrder);
}

export async function startGame(gameId: number, totalRounds: number) {
  await db
    .update(games)
    .set({ status: "PLAYING", currentRound: 0, totalRounds })
    .where(eq(games.id, gameId));
}

export async function submitRoundEntry(
  gameId: number,
  roundNumber: number,
  chainOwnerId: number,
  playerId: number,
  type: "TEXT" | "DRAWING",
  content: string
) {
  const result = await db
    .insert(rounds)
    .values({ gameId, roundNumber, chainOwnerId, playerId, type, content })
    .returning();
  return result[0];
}

export async function getRoundSubmissions(
  gameId: number,
  roundNumber: number
) {
  return db
    .select()
    .from(rounds)
    .where(
      and(eq(rounds.gameId, gameId), eq(rounds.roundNumber, roundNumber))
    );
}

export async function advanceRound(gameId: number, nextRound: number) {
  await db
    .update(games)
    .set({ currentRound: nextRound })
    .where(eq(games.id, gameId));
}

export async function setGameStatus(
  gameId: number,
  status: "LOBBY" | "PLAYING" | "REVEAL" | "VOTING" | "RESULTS" | "ARCHIVED"
) {
  await db.update(games).set({ status }).where(eq(games.id, gameId));
}

export async function getChain(gameId: number, chainOwnerId: number) {
  return db
    .select({
      id: rounds.id,
      roundNumber: rounds.roundNumber,
      chainOwnerId: rounds.chainOwnerId,
      playerId: rounds.playerId,
      type: rounds.type,
      content: rounds.content,
      submittedAt: rounds.submittedAt,
      playerNickname: players.nickname,
    })
    .from(rounds)
    .innerJoin(players, eq(rounds.playerId, players.id))
    .where(
      and(eq(rounds.gameId, gameId), eq(rounds.chainOwnerId, chainOwnerId))
    )
    .orderBy(rounds.roundNumber);
}

export async function getAllChains(gameId: number) {
  const allPlayers = await getPlayersForGame(gameId);
  const chains = [];
  for (const player of allPlayers) {
    const entries = await getChain(gameId, player.id);
    chains.push({
      chainOwnerId: player.id,
      ownerNickname: player.nickname,
      entries,
    });
  }
  return chains;
}

export async function getPreviousRoundContent(
  gameId: number,
  roundNumber: number,
  chainOwnerId: number
) {
  if (roundNumber === 0) return null;
  const result = await db
    .select()
    .from(rounds)
    .where(
      and(
        eq(rounds.gameId, gameId),
        eq(rounds.roundNumber, roundNumber - 1),
        eq(rounds.chainOwnerId, chainOwnerId)
      )
    )
    .limit(1);
  return result[0]?.content ?? null;
}

export async function castVote(
  gameId: number,
  voterId: number,
  chainOwnerId: number
) {
  const result = await db
    .insert(votes)
    .values({ gameId, voterId, chainOwnerId })
    .returning();
  return result[0];
}

export async function getVoteResults(gameId: number) {
  const allPlayers = await getPlayersForGame(gameId);
  const allVotes = await db
    .select()
    .from(votes)
    .where(eq(votes.gameId, gameId));

  const results = allPlayers.map((player) => {
    const playerVotes = allVotes.filter(
      (v) => v.chainOwnerId === player.id
    );
    const voterNames = playerVotes.map((v) => {
      const voter = allPlayers.find((p) => p.id === v.voterId);
      return voter?.nickname ?? "Unknown";
    });
    return {
      chainOwnerId: player.id,
      ownerNickname: player.nickname,
      voteCount: playerVotes.length,
      voters: voterNames,
    };
  });

  return results.sort((a, b) => b.voteCount - a.voteCount);
}

export async function getVoteCount(gameId: number) {
  const result = await db
    .select({ count: count() })
    .from(votes)
    .where(eq(votes.gameId, gameId));
  return result[0].count;
}

export async function hasPlayerVoted(gameId: number, playerId: number) {
  const result = await db
    .select()
    .from(votes)
    .where(and(eq(votes.gameId, gameId), eq(votes.voterId, playerId)))
    .limit(1);
  return result.length > 0;
}

export async function advanceReveal(gameId: number) {
  await db
    .update(games)
    .set({ revealChainIndex: sql`${games.revealChainIndex} + 1` })
    .where(eq(games.id, gameId));
}

export async function removePlayer(playerId: number) {
  await db.delete(players).where(eq(players.id, playerId));
}

export async function deleteGame(gameId: number) {
  await db.delete(votes).where(eq(votes.gameId, gameId));
  await db.delete(rounds).where(eq(rounds.gameId, gameId));
  await db.delete(players).where(eq(players.gameId, gameId));
  await db.delete(games).where(eq(games.id, gameId));
}

export async function getActiveGames() {
  return db
    .select()
    .from(games)
    .where(
      sql`${games.status} NOT IN ('RESULTS', 'ARCHIVED')`
    )
    .orderBy(games.createdAt);
}

export async function getAllGames() {
  return db
    .select()
    .from(games)
    .orderBy(games.createdAt);
}

export async function setPostGameChoice(
  playerId: number,
  choice: "play_again" | "exit"
) {
  await db
    .update(players)
    .set({ postGameChoice: choice })
    .where(eq(players.id, playerId));
}

export async function createRematchGame(
  oldGameId: number,
  newCode: string,
  roundDuration: number
) {
  const newGameResult = await db
    .insert(games)
    .values({ code: newCode, roundDurationSeconds: roundDuration })
    .returning();
  const newGame = newGameResult[0];

  const playAgainPlayers = await db
    .select()
    .from(players)
    .where(
      and(
        eq(players.gameId, oldGameId),
        eq(players.postGameChoice, "play_again")
      )
    )
    .orderBy(players.joinOrder);

  for (let i = 0; i < playAgainPlayers.length; i++) {
    const old = playAgainPlayers[i];
    await db.insert(players).values({
      gameId: newGame.id,
      nickname: old.nickname,
      joinOrder: i,
      sessionToken: old.sessionToken,
    });
  }

  await db
    .update(games)
    .set({ status: "ARCHIVED" })
    .where(eq(games.id, oldGameId));

  return newGame;
}
