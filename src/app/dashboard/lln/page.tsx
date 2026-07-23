import Link from "next/link";
import { ArrowRight, FileSearch, ShieldQuestion } from "lucide-react";

export default function LlnPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
      <section className="portal-card rounded-[28px] p-7 sm:p-8">
        <p className="portal-section-label">LLN</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-[#081221]">
          Language, literacy, and numeracy support.
        </h2>
        <p className="portal-page-copy mt-3 max-w-3xl">
          Use this space as your student support checkpoint before or during training. If you need guidance with reading load, communication confidence, or assessment readiness, VCK can step in early.
        </p>
        <div className="portal-subtle-card mt-6 rounded-[22px] p-6">
          <h3 className="text-xl font-black text-[#081221]">How this helps</h3>
          <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-[#5d7389]">
            <p>Clarify whether a course is the right fit before you get deep into the work.</p>
            <p>Surface any support needs early so training stays achievable and confident.</p>
            <p>Give VCK enough context to adjust guidance, pacing, or next steps where possible.</p>
          </div>
        </div>
        <div className="mt-6">
          <Link
            href="/dashboard/lln/certificate-iv-business-bsb40120"
            className="portal-button-primary inline-flex items-center gap-2 px-5 py-3 text-sm"
          >
            Take course readiness test
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="space-y-6">
        <article className="portal-card rounded-[28px] p-7">
          <div className="flex size-12 items-center justify-center rounded-[16px] bg-[#eef5fb] text-[#0f6eb8]">
            <ShieldQuestion size={22} />
          </div>
          <h3 className="mt-5 text-2xl font-black tracking-tight text-[#081221]">When to reach out</h3>
          <div className="mt-5 grid gap-3">
            {[
              "You want help understanding assessment language",
              "You need support with written responses or comprehension load",
              "You are unsure whether the training level matches your current readiness",
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
            <FileSearch size={22} />
          </div>
          <h3 className="mt-5 text-2xl font-black tracking-tight text-[#081221]">Need help now?</h3>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#5d7389]">
            Send a note through Feedback or contact VCK directly so the team can guide the best next step for your learning pathway.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/dashboard/feedback"
              className="portal-button-primary inline-flex items-center gap-2 px-5 py-3 text-sm"
            >
              Share support needs
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/dashboard/contact"
              className="portal-button-secondary inline-flex items-center gap-2 px-5 py-3 text-sm"
            >
              Contact VCK
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
