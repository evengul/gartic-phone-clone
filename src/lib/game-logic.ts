import type { RoundType } from "@/types";

export function getChainOwnerForPlayerInRound(
  playerJoinOrder: number,
  roundNumber: number,
  totalPlayers: number
): number {
  return ((playerJoinOrder - roundNumber) % totalPlayers + totalPlayers) % totalPlayers;
}

export function getPlayerForChainInRound(
  chainOwnerJoinOrder: number,
  roundNumber: number,
  totalPlayers: number
): number {
  return (chainOwnerJoinOrder + roundNumber) % totalPlayers;
}

export function getRoundType(roundNumber: number): RoundType {
  return roundNumber % 2 === 0 ? "TEXT" : "DRAWING";
}
