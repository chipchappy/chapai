import type { Metadata } from "next";
import { redirect } from "next/navigation";
import StudyDashboard from "@/components/dashboard/StudyDashboard";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Study Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function StudyPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/auth/login?next=/study");
  }

  return (
    <main className="min-h-screen bg-bg px-4 py-8 md:py-12">
      <StudyDashboard />
    </main>
  );
}
