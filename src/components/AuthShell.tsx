import Link from "next/link";
import { ShieldCheck, Users, GraduationCap, LineChart, type LucideIcon } from "lucide-react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  mode: "sign-in" | "sign-up";
  children: React.ReactNode;
};

export function AuthShell({ title, subtitle, mode, children }: AuthShellProps) {
  const featureRows: { heading: string; copy: string; icon: LucideIcon }[] = [
    {
      heading: mode === "sign-in" ? "Student Database" : "Student access",
      copy:
        mode === "sign-in"
          ? "Full enrolment and contact records"
          : "Course access and lesson records",
      icon: Users,
    },
    {
      heading: mode === "sign-in" ? "Course Management" : "Training programs",
      copy:
        mode === "sign-in"
          ? "Track training programs and modules"
          : "Structured lessons and admin-ready content",
      icon: GraduationCap,
    },
    {
      heading: mode === "sign-in" ? "Revenue Insights" : "Secure payments",
      copy:
        mode === "sign-in"
          ? "Payment tracking and reporting"
          : "Enrollment and reporting visibility",
      icon: LineChart,
    },
  ];

  return (
    <main className="grid min-h-screen bg-white text-[#101827] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[#082647] px-10 py-14 text-white lg:block xl:px-16">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:68px_68px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(146,208,255,0.15),transparent_30%),linear-gradient(140deg,#0a2444_0%,#123f71_56%,#0a223e_100%)]" />
        <div className="relative z-10 flex h-full min-h-[760px] flex-col justify-between">
          <Link href="/" className="flex items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <ShieldCheck size={24} />
            </span>
            <span>
              <span className="block text-[1.85rem] font-extrabold leading-none tracking-tight">VCK</span>
              <span className="mt-1 block text-xs font-bold uppercase tracking-[0.1em] text-white/50">
                {mode === "sign-in" ? "Admin Portal" : "Student Access"}
              </span>
            </span>
          </Link>

          <div className="max-w-xl">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4.5 py-1.5 text-xs font-bold text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <span className="size-1.5 rounded-full bg-[#f5b800]" />
              {mode === "sign-in" ? "SECURE COLLEGE ACCESS" : "SECURE STUDENT ACCESS"}
            </div>
            <h1 className="max-w-[12ch] text-4xl font-extrabold leading-[1.1] tracking-tight xl:text-[3.6rem]">
              {mode === "sign-in"
                ? "Welcome back to your learning community."
                : "Start your learning access with confidence."}
            </h1>
            <p className="mt-5 max-w-[26rem] text-base font-medium leading-relaxed text-white/70">
              {mode === "sign-in"
                ? "Access student records, learning progress and college operations from one secure dashboard."
                : "Use email to access enrolments, lessons, and your learning tools in one place."}
            </p>
          </div>

          <div className="grid max-w-xl gap-5">
            {featureRows.map(({ heading, copy, icon: Icon }) => (
              <div key={heading} className="grid grid-cols-[40px_1fr_20px] items-center gap-4">
                <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#f5b800]">
                  <Icon size={18} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-white">{heading}</span>
                  <span className="block text-xs font-medium text-white/50">{copy}</span>
                </span>
                <ShieldCheck size={16} className="text-emerald-400" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-6 py-12 lg:px-12">
        <div className="w-full max-w-[440px]">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">{title}</h2>
            <p className="mt-2 text-base font-medium text-slate-500">{subtitle}</p>
          </div>
          <div className="auth-card">{children}</div>
          <div className="mt-8 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-6 text-center text-xs font-semibold text-slate-400">
            <ShieldCheck size={15} className="text-slate-400" />
            Secure access · Victorian College of Knowledge
          </div>
        </div>
      </section>
    </main>
  );
}
