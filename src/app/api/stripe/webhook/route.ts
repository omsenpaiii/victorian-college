import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { cancelStripeCheckoutSession, fulfillStripeCheckoutSession } from "@/lib/payment-fulfillment";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured yet." },
      { status: 503 },
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      await fulfillStripeCheckoutSession({
        session,
        rawEvent: event as unknown as Record<string, unknown>,
      });
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object;
      await cancelStripeCheckoutSession({
        session,
        rawEvent: event as unknown as Record<string, unknown>,
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
