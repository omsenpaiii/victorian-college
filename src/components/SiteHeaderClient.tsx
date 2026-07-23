"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { primaryLinks } from "@/lib/site-content";

type HeaderUser = { name: string; email: string; initials: string; dashboardHref: string };

export function SiteHeaderClient({ user }: { user: HeaderUser | null }) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <nav aria-label="Main navigation" className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/70 bg-white/95 px-4 py-2 shadow-[0_16px_50px_rgba(8,28,63,.14)] backdrop-blur-xl sm:px-5">
        <Link href="/" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
          <span className="relative size-12 shrink-0 overflow-hidden rounded-full bg-white">
            <Image src="/vic-logo.png" alt="Victorian College of Knowledge crest" fill sizes="48px" className="object-contain" priority />
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block font-serif text-base font-semibold tracking-[.04em] text-[#071b3e]">Victorian College</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[.24em] text-[#7f6517]">of Knowledge</span>
          </span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {primaryLinks.map((link) => <Link key={link.href} href={link.href} className="text-sm font-semibold text-[#223451] transition hover:text-[#b78b18]">{link.label}</Link>)}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? <>
            <Link href={user.dashboardHref} className="rounded-full px-4 py-2.5 text-sm font-semibold text-[#071b3e]">Portal</Link>
            <SignOutButton className="rounded-full px-4 py-2.5 text-sm font-semibold text-[#071b3e]">Sign out</SignOutButton>
          </> : <Link href="/sign-in" className="rounded-full px-4 py-2.5 text-sm font-semibold text-[#071b3e]">Student login</Link>}
          <Link href="/courses" className="rounded-full bg-[#c79a24] px-5 py-2.5 text-sm font-bold text-[#071b3e] shadow-[0_10px_24px_rgba(199,154,36,.22)] transition hover:-translate-y-0.5 hover:bg-[#dfb94f]">Explore courses</Link>
        </div>

        <button type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)} className="grid size-11 place-items-center rounded-full bg-[#071b3e] text-white lg:hidden">
          {open ? <X size={19} /> : <Menu size={19} />}
        </button>
      </nav>

      <AnimatePresence>
        {open ? <motion.div initial={reduceMotion ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-auto mt-2 max-w-6xl rounded-[24px] border border-[#dfe5ed] bg-white p-3 shadow-xl lg:hidden">
          {primaryLinks.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 font-semibold text-[#071b3e] hover:bg-[#f1f5fa]">{link.label}</Link>)}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link href={user?.dashboardHref ?? "/sign-in"} onClick={() => setOpen(false)} className="rounded-full border border-[#ccd6e4] px-4 py-3 text-center text-sm font-semibold text-[#071b3e]">{user ? "Open portal" : "Student login"}</Link>
            <Link href="/courses" onClick={() => setOpen(false)} className="rounded-full bg-[#c79a24] px-4 py-3 text-center text-sm font-bold text-[#071b3e]">Explore courses</Link>
          </div>
        </motion.div> : null}
      </AnimatePresence>
    </header>
  );
}
