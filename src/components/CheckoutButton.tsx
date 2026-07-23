"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

type CheckoutButtonProps = {
  courseSlug: string;
  className?: string;
  children?: React.ReactNode;
};

export function CheckoutButton({
  courseSlug,
  className,
  children = "Enroll Now",
}: CheckoutButtonProps) {
  const href = `/enroll?course=${courseSlug}`;
  const label = children;

  return (
    <Link
      href={href}
      className={
        className ??
        "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0067b1] px-5 text-sm font-black text-white transition hover:bg-[#123e95]"
      }
    >
      <ArrowRight size={18} />
      {label}
    </Link>
  );
}
