import { appendOpsOverride, isOpsOverrideAction, listOpsOverrideActions, readOpsOverrides } from "@/lib/ops-control";
import { getDashboardAccessContext } from "@/lib/dashboard-access";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type OverridePayload = {
  action?: string;
  target?: string;
  reason?: string;
};

async function readPayload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return (await request.json()) as OverridePayload;
    } catch {
      return {};
    }
  }

  const formData = await request.formData();
  return {
    action: String(formData.get("action") ?? ""),
    target: String(formData.get("target") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  } satisfies OverridePayload;
}

export async function POST(request: Request) {
  const access = await getDashboardAccessContext();
  if (access.role !== "operator") {
    return NextResponse.json({ error: "Operator access is required for /ops overrides." }, { status: 403 });
  }

  const payload = await readPayload(request);
  const action = String(payload.action ?? "");
  const target = String(payload.target ?? "").trim();

  if (!isOpsOverrideAction(action)) {
    return NextResponse.json({ error: "Unsupported override action." }, { status: 400 });
  }

  if (!target) {
    return NextResponse.json({ error: "Override target is required." }, { status: 400 });
  }

  const record = appendOpsOverride({
    action,
    target,
    reason: payload.reason,
    requestedBy: access.displayLabel ?? "operator",
  });

  return NextResponse.json({ ok: true, record });
}

export async function GET() {
  const access = await getDashboardAccessContext();
  if (access.role !== "operator") {
    return NextResponse.json({ error: "Operator access is required for /ops overrides." }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    actions: listOpsOverrideActions(),
    overrides: readOpsOverrides(),
  });
}
