import type { Metadata } from "next";
import PricingCards from "@/components/marketing/PricingCards";

export const metadata: Metadata = {
  title: "Pricing | Clarity NCLEX",
  description: "Clarity NCLEX pricing: $9.99/mo for NCLEX Base, $15.99/mo for Dual Premium, and $4.99 24-hour passes.",
};

export default function PricingPage() {
  return <PricingCards />;
}
