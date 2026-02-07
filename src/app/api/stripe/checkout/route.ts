import { NextResponse } from "next/server";
import { stripe, PLANS, type PlanKey } from "@/lib/stripe";
import pb, { authenticateAdmin } from "@/lib/pocketbase";

export async function POST(request: Request) {
  try {
    const { planKey, userId } = (await request.json()) as {
      planKey: PlanKey;
      userId: string;
    };

    const plan = PLANS[planKey];
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Look up or create Stripe customer
    await authenticateAdmin();
    const user = await pb.collection("users").getOne(userId);

    let profiles;
    try {
      profiles = await pb
        .collection("profiles")
        .getFirstListItem(`user="${userId}"`);
    } catch {
      // No profile yet — create one
      profiles = await pb.collection("profiles").create({
        user: userId,
        plan: "free",
        subscription_status: "none",
      });
    }

    let customerId = profiles.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { pb_user_id: userId },
      });
      customerId = customer.id;
      await pb
        .collection("profiles")
        .update(profiles.id, { stripe_customer_id: customerId });
    }

    // Create Checkout Session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?checkout=success`,
      cancel_url: `${appUrl}/dashboard?checkout=cancel`,
      metadata: { pb_user_id: userId, plan: planKey },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
