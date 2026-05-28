import { createRequestContext } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { handleRouteError, jsonError, jsonSuccess } from "@/lib/http";
import { resolveEnv } from "@/lib/db";
import { DRUG_CARDS, searchDrugCardList, type DrugCard } from "@/lib/drug-cards";
import { getDrugCardsFromD1 } from "@/lib/drug-card-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestContext = createRequestContext(request, { route: "/api/study/pharmacology" });
  const user = await getAuthenticatedUser();
  if (!user) {
    return jsonError(401, "AUTH_REQUIRED", "Sign in to view pharmacology drug cards.", {
      requestId: requestContext.requestId,
    }, { requestId: requestContext.requestId });
  }

  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("q") ?? "";
    const env = resolveEnv();
    let source: "d1" | "static" = "static";
    let cards: DrugCard[] = DRUG_CARDS;

    try {
      const d1Cards = await getDrugCardsFromD1(env);
      if (d1Cards?.length) {
        cards = d1Cards;
        source = "d1";
      }
    } catch {
      cards = DRUG_CARDS;
      source = "static";
    }

    return jsonSuccess({
      cards: searchDrugCardList(cards, query),
      meta: {
        count: cards.length,
        source,
        checkedAt: new Date().toISOString(),
      },
    }, 200, { requestId: requestContext.requestId });
  } catch (error) {
    return handleRouteError(error, {
      requestId: requestContext.requestId,
      route: "/api/study/pharmacology",
    });
  }
}
