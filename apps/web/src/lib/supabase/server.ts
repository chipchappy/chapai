import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getServerEnv, hasSupabasePublicConfig } from "@/lib/env";

type CookieAdapter = {
  getAll: () => { name: string; value: string }[];
  setAll: (cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) => void;
};

function getSupabaseKeys() {
  const env = getServerEnv();
  if (!hasSupabasePublicConfig(env)) {
    return null;
  }

  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  };
}

function createClient(cookieAdapter: CookieAdapter) {
  const keys = getSupabaseKeys();
  if (!keys) {
    return null;
  }

  return createServerClient(keys.url, keys.anonKey, {
    cookies: cookieAdapter,
  });
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createClient({
    getAll() {
      return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      } catch {
        // Server components cannot always mutate cookies; callback/logout routes handle writes.
      }
    },
  });
}

export function createSupabaseRouteClient(request: NextRequest, response: NextResponse) {
  return createClient({
    getAll() {
      return request.cookies.getAll().map(({ name, value }) => ({ name, value }));
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value }) => {
        request.cookies.set(name, value);
      });
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
    },
  });
}

export function createSupabaseMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const client = createClient({
    getAll() {
      return request.cookies.getAll().map(({ name, value }) => ({ name, value }));
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value }) => {
        request.cookies.set(name, value);
      });
      response = NextResponse.next({
        request: {
          headers: request.headers,
        },
      });
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
    },
  });

  return {
    client,
    getResponse() {
      return response;
    },
  };
}

export async function getSupabaseServerUser(): Promise<User | null> {
  const client = await createSupabaseServerClient();
  if (!client) {
    return null;
  }

  const { data, error } = await client.auth.getUser();
  if (error) {
    return null;
  }

  return data.user ?? null;
}

export async function getSupabaseRouteUser(request: NextRequest) {
  const response = NextResponse.next();
  const client = createSupabaseRouteClient(request, response);
  if (!client) {
    return { user: null, response, client: null as ReturnType<typeof createSupabaseRouteClient> };
  }

  const { data, error } = await client.auth.getUser();
  return {
    user: error ? null : data.user ?? null,
    response,
    client,
  };
}

export async function getAuthenticatedUser() {
  return getSupabaseServerUser();
}
