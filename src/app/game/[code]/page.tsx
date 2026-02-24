import { GameView } from "@/components/GameView";

export default async function GamePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <GameView code={code.toUpperCase()} />;
}
