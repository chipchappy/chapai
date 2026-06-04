import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

function json(response: NextResponse | null, status: number, payload: unknown) {
  const body = JSON.stringify(payload);
  if (response) {
    return new NextResponse(body, {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
        Pragma: "no-cache",
        ...Object.fromEntries(response.headers.entries()),
      },
    });
  }
  return new NextResponse(body, {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
    },
  });
}

export async function POST(request: NextRequest) {
  const env = getServerEnv();
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return json(null, 400, {
      success: false,
      error: {
        code: "RESET_INVALID",
        message: parsed.error.issues[0]?.message ?? "Enter a matching password (8+ characters).",
      },
    });
  }

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return json(null, 503, {
      success: false,
      error: { code: "AUTH_UNAVAILABLE", message: "Password reset is temporarily unavailable." },
    });
  }

  const response = NextResponse.next();
  const supabase = createSupabaseRouteClient(request, response);
  if (!supabase) {
    return json(null, 503, {
      success: false,
      error: { code: "AUTH_UNAVAILABLE", message: "Password reset is temporarily unavailable." },
    });
  }

  const userResult = await supabase.auth.getUser();
  if (userResult.error || !userResult.data.user) {
    return json(null, 401, {
      success: false,
      error: {
        code: "RESET_SESSION_MISSING",
        message: "Your reset session has expired. Request a fresh reset link.",
      },
    });
  }

  const updateResult = await supabase.auth.updateUser({ password: parsed.data.password });
  if (updateResult.error) {
    const message = updateResult.error.message || "Could not update password.";
    const isWeak = /password/i.test(message) && /(weak|short|common|character)/i.test(message);
    logError("password reset update failed", updateResult.error, {
      userId: userResult.data.user.id,
    });
    return json(response, isWeak ? 400 : 500, {
      success: false,
      error: {
        code: isWeak ? "RESET_WEAK_PASSWORD" : "RESET_FAILED",
        message,
      },
    });
  }

  return json(response, 200, {
    success: true,
    data: {
      message: "Password updated. You can sign in with your new password.",
      redirectPath: "/auth/login?auth=reset-success",
    },
  });
}
