import type { User as SupabaseUser } from "@supabase/supabase-js";
import { users } from "@chapai/db/schema";
import { eq } from "drizzle-orm";
import type { DB } from "@/lib/db";

export async function syncAuthenticatedUserToD1(db: DB, user: SupabaseUser) {
  const email = user.email;
  if (!email) {
    return;
  }

  const existing = await db.select().from(users).where(eq(users.id, user.id)).get();
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = {
    email,
    name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
    updatedAt: timestamp,
  } as const;

  if (existing) {
    await db.update(users).set(payload).where(eq(users.id, user.id));
    return;
  }

  await db.insert(users).values({
    id: user.id,
    createdAt: timestamp,
    tier: "free",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripeCurrentPeriodEnd: null,
    ...payload,
  });
}
