import { NextRequest, NextResponse } from "next/server";
import { getGameByCode, getAllChains } from "@/lib/db/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const game = await getGameByCode(code);
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (!["REVEAL", "VOTING", "RESULTS"].includes(game.status)) {
    return NextResponse.json(
      { error: "Chains not available yet" },
      { status: 400 }
    );
  }

  const chains = await getAllChains(game.id);
  return NextResponse.json({ chains });
}
