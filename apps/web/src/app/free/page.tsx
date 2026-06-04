import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// /free is consolidated into /quiz ("Study now"). The practice center surfaces
// locked/unlocked questions based on tier. The /free/* category landing pages
// remain indexable for SEO; only the /free index route redirects.
export default function FreeIndexRedirect() {
  redirect("/quiz");
}
