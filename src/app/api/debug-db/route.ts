import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.TURSO_DATABASE_URL ?? "MISSING";
  const token = process.env.TURSO_AUTH_TOKEN ?? "MISSING";

  const httpsUrl = url.replace("libsql://", "https://");

  const results: Record<string, unknown> = {
    urlPrefix: url.substring(0, 30) + "...",
    tokenPrefix: token.substring(0, 20) + "...",
    tokenLength: token.length,
    httpsUrl: httpsUrl.substring(0, 35) + "...",
  };

  // Test raw fetch to Turso HTTP API
  try {
    const res = await fetch(`${httpsUrl}/v3/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [{ type: "execute", stmt: { sql: "SELECT 1" } }],
      }),
    });
    const body = await res.text();
    results.rawFetch = {
      status: res.status,
      statusText: res.statusText,
      body: body.substring(0, 500),
    };
  } catch (e) {
    results.rawFetch = { error: String(e) };
  }

  // Test @libsql/client/web directly
  try {
    const { createClient } = await import("@libsql/client/web");
    const client = createClient({ url, authToken: token });
    const rs = await client.execute("SELECT 1 as test");
    results.libsqlWeb = { ok: true, rows: rs.rows };
  } catch (e) {
    results.libsqlWeb = {
      error: String(e),
      cause: e instanceof Error && "cause" in e ? String(e.cause) : undefined,
    };
  }

  return NextResponse.json(results);
}
