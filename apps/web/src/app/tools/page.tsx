import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// /tools is consolidated into /dashboard — the personalized dashboard now
// includes the test-day countdown and quick links to the dedicated tool pages.
export default function ToolsIndexRedirect() {
  redirect("/dashboard");
}
