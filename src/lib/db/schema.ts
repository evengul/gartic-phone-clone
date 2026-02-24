import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const games = sqliteTable("games", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  status: text("status", {
    enum: ["LOBBY", "PLAYING", "REVEAL", "VOTING", "RESULTS", "ARCHIVED"],
  })
    .notNull()
    .default("LOBBY"),
  currentRound: integer("current_round").notNull().default(0),
  totalRounds: integer("total_rounds"),
  roundDurationSeconds: integer("round_duration_seconds").notNull().default(120),
  revealChainIndex: integer("reveal_chain_index").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const players = sqliteTable("players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameId: integer("game_id")
    .notNull()
    .references(() => games.id),
  nickname: text("nickname").notNull(),
  joinOrder: integer("join_order").notNull(),
  sessionToken: text("session_token").notNull(),
  isConnected: integer("is_connected", { mode: "boolean" })
    .notNull()
    .default(true),
  postGameChoice: text("post_game_choice", {
    enum: ["play_again", "exit"],
  }),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const rounds = sqliteTable("rounds", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameId: integer("game_id")
    .notNull()
    .references(() => games.id),
  roundNumber: integer("round_number").notNull(),
  chainOwnerId: integer("chain_owner_id")
    .notNull()
    .references(() => players.id),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id),
  type: text("type", { enum: ["TEXT", "DRAWING"] }).notNull(),
  content: text("content").notNull(),
  submittedAt: text("submitted_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const votes = sqliteTable("votes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameId: integer("game_id")
    .notNull()
    .references(() => games.id),
  voterId: integer("voter_id")
    .notNull()
    .references(() => players.id),
  chainOwnerId: integer("chain_owner_id")
    .notNull()
    .references(() => players.id),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
