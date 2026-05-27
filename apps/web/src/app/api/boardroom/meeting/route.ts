import { closeActiveBoardMeeting, summonAllAgents } from "@/lib/boardroom-control";
import { getDashboardAccessContext } from "@/lib/dashboard-access";
import { getMissionControlSnapshot } from "@/lib/mission-control";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type MeetingPayload = {
  action?: "summon" | "close";
  reason?: string;
};

async function readPayload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return (await request.json()) as MeetingPayload;
    } catch {
      return {};
    }
  }

  const formData = await request.formData();
  return {
    action: String(formData.get("action") ?? "") as MeetingPayload["action"],
    reason: String(formData.get("reason") ?? ""),
  } satisfies MeetingPayload;
}

export async function POST(request: Request) {
  const access = await getDashboardAccessContext();
  if (access.role !== "operator") {
    return NextResponse.json({ error: "Operator access is required for boardroom control." }, { status: 403 });
  }

  const payload = await readPayload(request);
  const snapshot = await getMissionControlSnapshot();
  const requestedBy = access.displayLabel ?? "operator";

  if (payload.action === "summon") {
    const boardroom = await summonAllAgents({
      snapshot,
      requestedBy,
      reason: payload.reason,
      autoResume: true,
    });
    return NextResponse.json({ ok: true, boardroom });
  }

  if (payload.action === "close") {
    const boardroom = await closeActiveBoardMeeting(snapshot, requestedBy);
    return NextResponse.json({ ok: true, boardroom });
  }

  return NextResponse.json({ error: "Unsupported boardroom action." }, { status: 400 });
}
