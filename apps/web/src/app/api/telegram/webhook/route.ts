import { NextRequest, NextResponse } from "next/server";
import { appendTelegramControlMessage } from "@/lib/telegram-control";

export const runtime = "nodejs";

type TelegramMessage = {
  message_id?: number | string;
  message_thread_id?: number | string;
  text?: string;
  chat?: { id?: number | string };
  from?: { id?: number | string };
  date?: number;
};

type TelegramWebhookUpdate = {
  update_id?: number | string;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  callback_query?: {
    id?: string;
    data?: string;
    from?: { id?: number | string };
    message?: TelegramMessage;
  };
};

function splitEnvList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function validateSecret(request: NextRequest) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!expected) return true;
  return request.headers.get("x-telegram-bot-api-secret-token") === expected;
}

function extractControlMessage(update: TelegramWebhookUpdate) {
  const callback = update.callback_query;
  const message = update.message ?? update.edited_message ?? update.channel_post ?? callback?.message;
  const text = message?.text ?? callback?.data;
  const chatId = message?.chat?.id;
  const userId = message?.from?.id ?? callback?.from?.id;

  if (!message || !text || chatId === undefined || userId === undefined) {
    return null;
  }

  return {
    text,
    messageId: String(message.message_id ?? callback?.id ?? update.update_id ?? "telegram-update"),
    chatId: String(chatId),
    userId: String(userId),
    thread: message.message_thread_id ? String(message.message_thread_id) : "orchestrator",
    receivedAt: message.date ? new Date(Number(message.date) * 1000).toISOString() : new Date().toISOString(),
    runId: `telegram-webhook-${new Date().toISOString().slice(0, 10)}`,
  };
}

export async function POST(request: NextRequest) {
  if (!validateSecret(request)) {
    return NextResponse.json({ ok: false, error: "invalid_telegram_secret" }, { status: 401 });
  }

  const allowedChatIds = splitEnvList(process.env.TELEGRAM_ALLOWED_CHAT_IDS);
  if (allowedChatIds.length === 0) {
    return NextResponse.json({ ok: false, error: "telegram_allowlist_missing" }, { status: 403 });
  }

  let update: TelegramWebhookUpdate;
  try {
    update = await request.json() as TelegramWebhookUpdate;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const controlMessage = extractControlMessage(update);
  if (!controlMessage) {
    return NextResponse.json({ ok: true, ignored: true, reason: "no_text_message" }, { status: 202 });
  }
  if (!allowedChatIds.includes(controlMessage.chatId)) {
    return NextResponse.json({ ok: false, error: "chat_not_allowed" }, { status: 403 });
  }

  const result = appendTelegramControlMessage(controlMessage);
  return NextResponse.json({
    ok: result.parsed.ok,
    command: result.parsed.command,
    action: result.parsed.action,
    intent: result.parsed.intent,
    requiresApproval: result.parsed.requiresApproval,
    requiresConfirmation: result.parsed.requiresConfirmation,
    reason: result.parsed.reason ?? null,
    events: result.events.length,
  });
}
