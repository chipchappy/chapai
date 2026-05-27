import { createBrowserClient } from "@supabase/ssr";

let cachedClient: ReturnType<typeof createBrowserClient> | null = null;

function getBrowserSupabaseKeys() {
  const runtimeEnv = (globalThis as { __ENV__?: Record<string, string | undefined> }).__ENV__ ?? {};
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? runtimeEnv.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function createSupabaseBrowserClient() {
  const keys = getBrowserSupabaseKeys();
  if (!keys) {
    throw new Error("Supabase browser config is missing.");
  }

  if (!cachedClient) {
    cachedClient = createBrowserClient(keys.url, keys.anonKey);
  }

  return cachedClient;
}

export function getBrowserSupabaseClient() {
  return createSupabaseBrowserClient();
}
