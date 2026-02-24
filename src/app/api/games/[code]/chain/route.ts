import { NextRequest, NextResponse } from "next/server";
import { getGameByCode, getChain } from "@/lib/db/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const chainOwnerId = request.nextUrl.searchParams.get("chainOwnerId");

  if (!chainOwnerId) {
    return NextResponse.json(
      { error: "chainOwnerId is required" },
      { status: 400 }
    );
  }

  const game = await getGameByCode(code);
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const entries = await getChain(game.id, Number(chainOwnerId));
  return NextResponse.json({ entries });
}
