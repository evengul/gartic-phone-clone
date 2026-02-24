export type GameStatus = "LOBBY" | "PLAYING" | "REVEAL" | "VOTING" | "RESULTS";
export type RoundType = "TEXT" | "DRAWING";
export type PostGameChoice = "play_again" | "exit" | null;

export interface Game {
  id: number;
  code: string;
  status: GameStatus;
  currentRound: number;
  totalRounds: number | null;
  roundDurationSeconds: number;
  revealChainIndex: number;
}

export interface Player {
  id: number;
  gameId: number;
  nickname: string;
  joinOrder: number;
  isConnected: boolean;
}

export interface RoundEntry {
  id: number;
  roundNumber: number;
  chainOwnerId: number;
  playerId: number;
  type: RoundType;
  content: string;
  playerNickname?: string;
}

export interface ChainRevealData {
  chainOwnerId: number;
  ownerNickname: string;
  entries: RoundEntry[];
}

export interface VoteResult {
  chainOwnerId: number;
  ownerNickname: string;
  voteCount: number;
  voters: string[];
}

export interface GameState {
  game: Game;
  players: Player[];
  myPlayer: Player | null;
  isAdmin: boolean;
  currentAssignment: {
    chainOwnerId: number;
    type: RoundType;
    previousContent: string | null;
  } | null;
  submittedThisRound: boolean;
  submittedPlayerIds: number[];
  postGameChoices?: Record<number, PostGameChoice>;
  voteResults?: VoteResult[];
}
