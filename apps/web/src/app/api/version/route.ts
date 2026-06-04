import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Returns the commit SHA baked into the build. Predeploy guardrails read this
// to detect rollback attempts from older checkouts.
export async function GET() {
  const commit = process.env.NEXT_PUBLIC_COMMIT_SHA ?? null;
  const builtAt = process.env.NEXT_PUBLIC_BUILD_AT ?? null;
  return NextResponse.json(
    { success: true, data: { commit, builtAt } },
    {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" },
    },
  );
}
