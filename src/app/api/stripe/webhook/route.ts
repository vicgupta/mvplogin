import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import pb, { authenticateAdmin } from "@/lib/pocketbase";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await authenticateAdmin();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.pb_user_id;
        const plan = session.metadata?.plan || "pro";

        if (userId && session.subscription) {
          const profile = await pb
            .collection("profiles")
            .getFirstListItem(`user="${userId}"`);

          await pb.collection("profiles").update(profile.id, {
            plan,
            subscription_status: "active",
            stripe_subscription_id: session.subscription,
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer;

        try {
          const profile = await pb
            .collection("profiles")
            .getFirstListItem(`stripe_customer_id="${customerId}"`);

          await pb.collection("profiles").update(profile.id, {
            subscription_status: subscription.status,
          });
        } catch {
          // Profile not found for this customer — ignore
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer;

        try {
          const profile = await pb
            .collection("profiles")
            .getFirstListItem(`stripe_customer_id="${customerId}"`);

          await pb.collection("profiles").update(profile.id, {
            plan: "free",
            subscription_status: "canceled",
            stripe_subscription_id: "",
          });
        } catch {
          // Profile not found — ignore
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
