import { MessageSquareQuote, Sparkles } from "lucide-react";
import { FeedbackForm } from "@/components/student/FeedbackForm";

export default function FeedbackPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
      <section className="portal-card rounded-[28px] p-7 sm:p-8">
        <p className="portal-section-label">Feedback</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-[#081221]">
          Help us sharpen the student experience.
        </h2>
        <p className="portal-page-copy mt-3 max-w-3xl">
          Share what feels smooth, where you got blocked, or what would make the portal more useful in day-to-day training. Your message goes straight to the VCK team.
        </p>

        <div className="portal-subtle-card mt-6 rounded-[22px] p-6">
          <FeedbackForm />
        </div>
      </section>

      <section className="space-y-6">
        <article className="portal-card rounded-[28px] p-7">
          <div className="flex size-12 items-center justify-center rounded-[16px] bg-[#eef5fb] text-[#0f6eb8]">
            <Sparkles size={22} />
          </div>
          <h3 className="mt-5 text-2xl font-black tracking-tight text-[#081221]">What to include</h3>
          <div className="mt-5 space-y-4 text-sm font-semibold leading-6 text-[#5d7389]">
            <p>Tell us which page or course you were on.</p>
            <p>Explain what you expected to happen and what actually happened.</p>
            <p>If it is about learning content, mention the course code or activity title.</p>
          </div>
        </article>

        <article className="portal-card rounded-[28px] p-7">
          <div className="flex size-12 items-center justify-center rounded-[16px] bg-[#eef5fb] text-[#0f6eb8]">
            <MessageSquareQuote size={22} />
          </div>
          <h3 className="mt-5 text-2xl font-black tracking-tight text-[#081221]">Best for this channel</h3>
          <div className="mt-5 grid gap-3">
            {[
              "Portal bugs or broken flows",
              "Course navigation confusion",
              "Resource requests",
              "General student experience suggestions",
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
      </section>
    </div>
  );
}
