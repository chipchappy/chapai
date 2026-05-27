import { createClient } from "@supabase/supabase-js";
import { getServerEnv, hasSupabaseServiceRole } from "@/lib/env";

let cachedClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdminClient() {
  const env = getServerEnv();
  if (!hasSupabaseServiceRole(env)) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  return cachedClient;
}
