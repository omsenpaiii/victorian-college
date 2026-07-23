"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type PaymentSuccessRedirectProps = {
  href: string;
  enabled: boolean;
  delayMs?: number;
};

export function PaymentSuccessRedirect({
  href,
  enabled,
  delayMs = 2400,
}: PaymentSuccessRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const timer = window.setTimeout(() => {
      router.replace(href);
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [delayMs, enabled, href, router]);

  return null;
}
