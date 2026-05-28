import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PharmacologyCardsClient from "@/app/study/pharmacology/PharmacologyCardsClient";
import { DRUG_CARDS } from "@/lib/drug-cards";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pharmacology Drug Cards",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function PharmacologyPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/auth/login?next=/study/pharmacology");
  }

  return (
    <main className="min-h-screen bg-bg px-4 py-8 md:py-12">
      <div className="mx-auto max-w-6xl">
        <PharmacologyCardsClient initialCards={DRUG_CARDS} />
      </div>
    </main>
  );
}
