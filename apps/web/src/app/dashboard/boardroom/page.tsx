import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boardroom",
  description: "Private boardroom for live agent activity, summon control, and presentation mode.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function BoardroomPage() {
  redirect("/dashboard#boardroom");
}
