import Stripe from "stripe";
import { getAppUrl } from "@/lib/app-url";

let stripeClient: Stripe | null = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia",
      typescript: true,
    });
  }

  return stripeClient;
}

function buildStripeUrl(path: string, params?: Record<string, string>) {
  const url = new URL(path, getAppUrl());

  Object.entries(params ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url.toString();
}

export function getStripeUserMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (/Stripe is not configured/i.test(message)) {
    return "Online payments are temporarily unavailable. Please contact VCK support.";
  }

  return message || "Unable to start payment.";
}

export async function createStripeCheckoutSession(input: {
  amountCents: number;
  name: string;
  description?: string | null;
  customerEmail?: string | null;
  metadata: Record<string, string | number | null | undefined>;
  successPath?: string;
  cancelPath?: string;
}) {
  const stripe = getStripe();

  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const successUrl = buildStripeUrl(input.successPath ?? "/success", {
    session_id: "{CHECKOUT_SESSION_ID}",
  });
  const cancelUrl = buildStripeUrl(input.cancelPath ?? "/cancel");
  const metadata = Object.fromEntries(
    Object.entries(input.metadata)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)]),
  );

  return stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.customerEmail || undefined,
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: metadata.userKey,
    metadata,
    payment_intent_data: {
      metadata,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "aud",
          unit_amount: input.amountCents,
          product_data: {
            name: input.name,
            description: input.description ?? undefined,
          },
        },
      },
    ],
  });
}
