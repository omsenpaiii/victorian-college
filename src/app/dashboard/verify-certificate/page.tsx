import Link from "next/link";
import { BadgeCheck, Mail, PhoneCall, ShieldCheck } from "lucide-react";
import { buildVerifyCertificateSteps } from "@/lib/student-portal";
import { siteInfo } from "@/lib/site-content";

export default function VerifyCertificatePage() {
  const steps = buildVerifyCertificateSteps();

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="portal-card rounded-[28px] p-7 sm:p-8">
        <p className="portal-section-label">Verify certificate</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-[#081221]">
          Start a fast certificate verification request.
        </h2>
        <p className="portal-page-copy mt-3 max-w-3xl">
          VCK can help confirm training records, statements of attainment, and certificate details. Bring the core identifiers and the team can guide the next step.
        </p>

        <div className="mt-6 space-y-4">
          {steps.map((step, index) => (
            <div
              key={step}
              className="portal-subtle-card flex gap-4 rounded-[20px] p-5"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-[#0f6eb8] text-sm font-black text-white">
                {index + 1}
              </div>
              <p className="text-sm font-semibold leading-6 text-[#5d7389]">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <article className="portal-card rounded-[28px] p-7">
          <div className="flex size-12 items-center justify-center rounded-[16px] bg-[#eef5fb] text-[#0f6eb8]">
            <BadgeCheck size={22} />
          </div>
          <h3 className="mt-5 text-2xl font-black tracking-tight text-[#081221]">What to prepare</h3>
          <div className="mt-5 grid gap-3">
            {[
              "Student full name",
              "Course name or code",
              "Certificate number if available",
              "Approximate completion date",
            ].map((item) => (
              <div
                key={item}
                className="portal-subtle-card rounded-[16px] px-4 py-3 text-sm font-black text-[#081221]"
              >
                {item}
              </div>
            ))}
          </div>
        </article>

        <article className="portal-card rounded-[28px] p-7">
          <div className="flex size-12 items-center justify-center rounded-[16px] bg-[#eef5fb] text-[#0f6eb8]">
            <ShieldCheck size={22} />
          </div>
          <h3 className="mt-5 text-2xl font-black tracking-tight text-[#081221]">Contact VCK for verification</h3>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`mailto:${siteInfo.email}`}
              className="portal-button-primary inline-flex items-center gap-2 px-5 py-3 text-sm"
            >
              <Mail size={16} />
              Email verification request
            </Link>
            <Link
              href={siteInfo.phoneHref}
              className="portal-button-secondary inline-flex items-center gap-2 px-5 py-3 text-sm"
            >
              <PhoneCall size={16} />
              Call VCK
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
