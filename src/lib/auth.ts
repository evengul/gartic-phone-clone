import { cookies } from "next/headers";
import { db } from "./db";
import { players } from "./db/schema";
import { and, eq } from "drizzle-orm";

const ADMIN_COOKIE = "gartic-admin";

export function createAdminToken(): string {
  const secret = process.env.ADMIN_SECRET!;
  // Simple token: base64(timestamp:secret)
  const payload = `${Date.now()}:${secret}`;
  return Buffer.from(payload).toString("base64");
}

export function verifyAdminToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64").toString();
    const secret = decoded.split(":")[1];
    return secret === process.env.ADMIN_SECRET!;
  } catch {
    return false;
  }
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}

export async function setAdminCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, createAdminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function getPlayerFromCookie(
  gameId: number
): Promise<typeof players.$inferSelect | null> {
  const cookieStore = await cookies();
  // Look for game-specific session cookie
  const token = cookieStore.get(`gartic-session-${gameId}`)?.value;
  if (!token) return null;

  const result = await db
    .select()
    .from(players)
    .where(and(eq(players.gameId, gameId), eq(players.sessionToken, token)))
    .limit(1);

  return result[0] ?? null;
}

export async function getPlayerFromRequest(
  gameCode: string,
  gameId: number,
  request?: Request
): Promise<typeof players.$inferSelect | null> {
  // Check header first (per-tab), then fall back to cookie (shared)
  let token = request?.headers.get("X-Session-Token") ?? null;

  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get(`gartic-session-${gameCode}`)?.value ?? null;
  }

  if (!token) return null;

  const result = await db
    .select()
    .from(players)
    .where(and(eq(players.gameId, gameId), eq(players.sessionToken, token)))
    .limit(1);

  return result[0] ?? null;
}
