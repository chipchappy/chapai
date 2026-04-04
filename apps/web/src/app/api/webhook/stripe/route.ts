/**
 * Alias route for /api/webhook/stripe → forwards to /api/stripe/webhook
 * Required because the Stripe test-mode webhook was registered at this path.
 * The canonical handler lives at /api/stripe/webhook.
 */
export { POST } from "@/app/api/stripe/webhook/route";
