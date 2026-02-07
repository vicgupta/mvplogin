import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import pb, { authenticateAdmin } from "@/lib/pocketbase";

export async function POST(request: Request) {
  try {
    const { userId } = (await request.json()) as { userId: string };

    await authenticateAdmin();
    const profile = await pb
      .collection("profiles")
      .getFirstListItem(`user="${userId}"`);

    if (!profile.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe customer found" },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/dashboard/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Portal session error:", err);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
