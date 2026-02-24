import { NextRequest, NextResponse } from "next/server";
import { getPusher } from "@/lib/pusher/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { players } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const socketId = formData.get("socket_id") as string;
  const channelName = formData.get("channel_name") as string;

  if (!socketId || !channelName) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // Extract game code from channel name (presence-game-ABCD12)
  const match = channelName.match(/^presence-game-(.+)$/);
  if (!match) {
    return NextResponse.json({ error: "Invalid channel" }, { status: 403 });
  }

  const gameCode = match[1];

  // Check header first (per-tab), then fall back to cookie
  let sessionToken = request.headers.get("X-Session-Token");
  if (!sessionToken) {
    const cookieStore = await cookies();
    sessionToken = cookieStore.get(`gartic-session-${gameCode}`)?.value ?? null;
  }

  if (!sessionToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 403 });
  }

  // Look up the player
  const result = await db
    .select()
    .from(players)
    .where(eq(players.sessionToken, sessionToken))
    .limit(1);

  const player = result[0];
  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 403 });
  }

  const authResponse = getPusher().authorizeChannel(socketId, channelName, {
    user_id: String(player.id),
    user_info: {
      nickname: player.nickname,
    },
  });

  return NextResponse.json(authResponse);
}
