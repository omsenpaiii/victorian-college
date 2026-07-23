"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarCheck,
  CheckSquare,
  CircleHelp,
  GraduationCap,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  ScanSearch,
  Users,
  X,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import type { AppUser } from "@/lib/auth";

type StudentPortalShellProps = {
  user: AppUser;
  stats: {
    totalCourses: number;
    activeEnrollments: number;
    completedActivities: number;
    remainingActivities: number;
  };
  children: React.ReactNode;
};

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/browse-courses", label: "Browse Courses", icon: BriefcaseBusiness },
  { href: "/dashboard/my-courses", label: "My Courses", icon: GraduationCap },
  { href: "/dashboard/lln", label: "LLN", icon: CircleHelp },
  { href: "/dashboard/contact", label: "Contact", icon: Bell },
  { href: "/dashboard/verify-certificate", label: "Verify Certificate", icon: ScanSearch },
];

const statItems = [
  {
    key: "totalCourses",
    label: "Enrolled Courses",
    action: "View all",
    href: "/dashboard/my-courses",
    icon: BookOpen,
    tone: "bg-[#eef5ff] text-[#0f6eb8]",
  },
  {
    key: "activeEnrollments",
    label: "Active Enrolments",
    action: "View all",
    href: "/dashboard/my-courses",
    icon: Users,
    tone: "bg-[#eef5ff] text-[#0f6eb8]",
  },
  {
    key: "completedActivities",
    label: "Completed Activities",
    action: "View progress",
    href: "/dashboard/my-courses",
    icon: CalendarCheck,
    tone: "bg-[#e8f8ef] text-[#19a463]",
  },
  {
    key: "remainingActivities",
    label: "Tasks Remaining",
    action: "View tasks",
    href: "/dashboard",
    icon: CheckSquare,
    tone: "bg-[#fff2e8] text-[#f97316]",
  },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard/my-courses" && pathname.startsWith("/dashboard/course/")) {
    return true;
  }

  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StudentPortalShell({ user, stats, children }: StudentPortalShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fbfdff] text-[#081221]">
      <header className="sticky top-0 z-40 border-b border-[#dbe3ec] bg-white/95 backdrop-blur">
        <div className="mx-auto grid h-[86px] max-w-[1560px] grid-cols-[minmax(0,1fr)_auto] items-center gap-5 px-5 lg:px-8 xl:grid-cols-[260px_minmax(0,1fr)_auto]">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <span className="relative flex size-11 shrink-0 overflow-hidden rounded-[10px] bg-white p-1.5 shadow-[0_2px_10px_rgba(15,23,42,0.12)] ring-1 ring-[#dbe7f3]">
              <Image
                src="/vck.jpg"
                alt="VCK logo"
                fill
                sizes="44px"
                className="object-contain object-[56%_50%]"
              />
            </span>
            <span>
              <span className="block text-[1.45rem] font-black leading-none tracking-tight text-[#004b93]">
                VCK
              </span>
              <span className="mt-1 block text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#5d7389]">
                Student Portal
              </span>
            </span>
          </Link>

          <nav className="hidden h-full min-w-0 items-center justify-center gap-1 xl:flex">
            {navItems.map(({ href, label }) => {
              const active = isActivePath(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex h-full items-center px-3 text-[0.92rem] font-semibold leading-none transition 2xl:px-4 ${
                    active ? "text-[#0059c8]" : "text-[#081221] hover:text-[#0059c8]"
                  }`}
                >
                  <span className="whitespace-nowrap">{label}</span>
                  {active ? (
                    <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-[#0f6eb8]" />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="hidden min-w-0 items-center justify-end gap-3 xl:flex">
            <div className="flex h-14 min-w-0 items-center gap-3 rounded-[8px] border border-[#dbe3ec] bg-white px-3 shadow-[0_4px_14px_rgba(15,23,42,0.08)]">
              <span className="flex size-10 items-center justify-center rounded-full bg-[#0f6eb8] text-sm font-black text-white">
                {user.initials}
              </span>
              <span className="hidden min-w-0 max-w-[210px] text-left lg:block">
                <span className="block truncate text-sm font-bold text-[#081221]">{user.name}</span>
                <span className="block truncate text-xs font-medium text-[#64748b]">{user.email}</span>
              </span>
            </div>
            <SignOutButton className="inline-flex h-14 items-center gap-2 rounded-[8px] border border-[#dbe3ec] bg-white px-4 text-sm font-semibold text-[#081221] transition hover:border-[#0f6eb8] hover:text-[#0f6eb8] disabled:cursor-wait disabled:opacity-70">
              <LogOut size={17} />
              <span className="whitespace-nowrap">Sign out</span>
            </SignOutButton>
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex size-11 items-center justify-center rounded-[8px] border border-[#dbe3ec] bg-white text-[#0f6eb8] xl:hidden"
            aria-label={open ? "Close navigation" : "Open navigation"}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open ? (
          <div className="border-t border-[#dbe3ec] bg-white xl:hidden">
            <div className="mx-auto max-w-[1480px] px-5 py-4">
              <div className="grid gap-2">
                {navItems.map(({ href, label, icon: Icon }) => {
                  const active = isActivePath(pathname, href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-[8px] px-4 py-3 text-sm font-semibold transition ${
                        active
                          ? "bg-[#0f6eb8] text-white"
                          : "text-[#334155] hover:bg-[#eef5ff] hover:text-[#0f6eb8]"
                      }`}
                    >
                      <Icon size={18} />
                      {label}
                    </Link>
                  );
                })}
              </div>
              <SignOutButton className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[8px] border border-[#dbe3ec] bg-white px-4 py-3 text-sm font-semibold text-[#081221] disabled:cursor-wait disabled:opacity-70 sm:hidden">
                <LogOut size={17} />
                Sign out
              </SignOutButton>
            </div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-[1560px] px-5 py-5 lg:px-8">
        <section className="mb-5 overflow-hidden rounded-[8px] border border-[#dbe3ec] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
          <div className="grid divide-y divide-[#e5edf5] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
          {statItems.map((item) => {
            const Icon = item.icon;
            const value = stats[item.key];
            return (
              <article key={item.key} className="grid min-h-[84px] grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-4 px-5 py-4">
                <div className={`flex size-11 shrink-0 items-center justify-center rounded-[8px] ${item.tone}`}>
                  <Icon size={21} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#475569]">{item.label}</p>
                  <p className="mt-1 text-2xl font-black leading-none text-[#081221]">{value}</p>
                </div>
                <Link
                  href={item.href}
                  className="hidden shrink-0 items-center gap-1 whitespace-nowrap text-sm font-semibold text-[#0059c8] transition hover:text-[#003f8e] sm:inline-flex"
                >
                  {item.action}
                  <ArrowRight size={15} />
                </Link>
              </article>
            );
          })}
          </div>
        </section>
        {children}
      </main>
    </div>
  );
}
