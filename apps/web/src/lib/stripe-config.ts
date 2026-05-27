import { getServerEnv } from "@/lib/env";
import { STRIPE_PRICES } from "@/lib/types";

export function getStripePriceMap() {
  const env = getServerEnv();

  return {
    nclex_24h_pass: env.STRIPE_PRICE_NCLEX_24H || "",
    ccrn_24h_pass: env.STRIPE_PRICE_CCRN_24H || "",
    nclex_base_monthly: env.STRIPE_PRICE_NCLEX_BASE_MONTHLY || "",
    ccrn_base_monthly: env.STRIPE_PRICE_CCRN_BASE_MONTHLY || "",
    all_access_monthly: env.STRIPE_PRICE_ALL_ACCESS_MONTHLY || "",
    nclex_4day: env.STRIPE_PRICE_NCLEX_4DAY || "",
    ccrn_4day: env.STRIPE_PRICE_CCRN_4DAY || "",
    core_monthly: env.STRIPE_PRICE_CORE_MONTHLY || "",
    legacy_plus_monthly: env.STRIPE_PRICE_PLUS_MONTHLY || STRIPE_PRICES.vip_monthly,
    legacy_pro_monthly: env.STRIPE_PRICE_PRO_MONTHLY || STRIPE_PRICES.unlimited_vip,
  };
}
