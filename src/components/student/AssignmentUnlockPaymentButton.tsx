"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";

type AssignmentUnlockPaymentButtonProps = {
  assignmentKey: string;
  enabled: boolean;
  amountCents?: number | null;
  courseSlug: string;
};

async function readJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

export function AssignmentUnlockPaymentButton({
  assignmentKey,
  enabled,
  amountCents,
  courseSlug,
}: AssignmentUnlockPaymentButtonProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function startPayment() {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/student/courses/${courseSlug}/assignments/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentKey }),
      });
      const result = await readJson<{
        url?: string;
        error?: string;
        signInUrl?: string;
        llnRequired?: boolean;
        llnUrl?: string;
      }>(response);

      if (response.status === 401 && result.signInUrl) {
        window.location.assign(result.signInUrl);
        return;
      }

      if (response.status === 403 && result.llnRequired && result.llnUrl) {
        window.location.assign(result.llnUrl);
        return;
      }

      if (!response.ok || !result.url) {
        throw new Error(result.error ?? "Unable to start payment.");
      }

      window.location.assign(result.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start payment.");
    } finally {
      setIsLoading(false);
    }
  }

  const amountLabel = amountCents
    ? new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
        maximumFractionDigits: 0,
      }).format(amountCents / 100)
    : null;

  if (!enabled) {
    return (
      <p className="mt-3 text-sm font-semibold leading-6 text-[#5d7389]">
        Payment is not available yet. VCK will publish access pricing shortly.
      </p>
    );
  }

  return (
    <div className="mt-4">
      <p className="mb-3 text-sm font-semibold leading-6 text-[#5d7389]">
        One {amountLabel ?? "payment"} unlocks the remaining assessments for your learner account.
      </p>
      <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-[#0f6eb8]">
        Secure checkout powered by Stripe
      </p>
      <button
        type="button"
        onClick={startPayment}
        disabled={isLoading}
        className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#0f6eb8] px-4 text-sm font-black text-white shadow-[0_8px_18px_rgba(15,110,184,0.18)] transition hover:bg-[#0b5f9f] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <CreditCard size={16} />
        {isLoading ? "Starting payment..." : `Unlock remaining clusters${amountLabel ? ` - ${amountLabel}` : ""}`}
      </button>
      {message ? (
        <p className="mt-2 text-sm font-semibold text-rose-600">{message}</p>
      ) : null}
    </div>
  );
}
