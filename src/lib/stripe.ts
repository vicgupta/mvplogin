import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
});

/**
 * Map your plan names to Stripe Price IDs.
 * Replace these with your actual Stripe price IDs.
 */
export const PLANS = {
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID || "price_pro_placeholder",
    price: "$29/mo",
  },
  enterprise: {
    name: "Enterprise",
    priceId:
      process.env.STRIPE_ENTERPRISE_PRICE_ID || "price_enterprise_placeholder",
    price: "$99/mo",
  },
} as const;

export type PlanKey = keyof typeof PLANS;
