"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Loader2,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { CourseWorkflowLlnMode, LlnAttemptSummary, PublicLlnQuestion } from "@/lib/lln";

type CourseWorkflowLlnTestProps = {
  questions: PublicLlnQuestion[];
  latestAttempt: LlnAttemptSummary | null;
  returnTo: string;
  mode: CourseWorkflowLlnMode;
  assignmentKey?: string | null;
  buyAmountCents: number;
  unlockAmountCents: number;
  courseSlug: string;
};

type SubmitResult = {
  attempt?: LlnAttemptSummary;
  error?: string;
};

async function readJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

function formatAud(amountCents: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

export function CourseWorkflowLlnTest({
  questions,
  latestAttempt,
  returnTo,
  mode,
  assignmentKey,
  buyAmountCents,
  unlockAmountCents,
  courseSlug,
}: CourseWorkflowLlnTestProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attempt, setAttempt] = useState<LlnAttemptSummary | null>(latestAttempt);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);

  const groupedQuestions = useMemo(() => {
    return questions.reduce<Record<string, PublicLlnQuestion[]>>((groups, question) => {
      groups[question.section] = groups[question.section] ?? [];
      groups[question.section].push(question);
      return groups;
    }, {});
  }, [questions]);

  const answeredCount = Object.keys(answers).length;
  const canSubmit = answeredCount === questions.length;
  const latestPassed = attempt?.passed ?? false;
  const isPurchaseMode = mode === "buy";
  const isUnlockMode = mode === "unlock";
  const actionAmount = isUnlockMode ? unlockAmountCents : buyAmountCents;
  const actionLabel = isUnlockMode
    ? `Unlock remaining clusters - ${formatAud(actionAmount)}`
    : `Buy Now - ${formatAud(actionAmount)}`;
  const passedHeading = isUnlockMode
    ? "Prerequisite cleared. You can unlock the remaining clusters now."
    : "Prerequisite cleared. You can continue now.";
  const passedCopy = isUnlockMode
    ? "Your LLN result is saved. Continue to secure Stripe checkout to unlock all remaining course assessments."
    : "Your LLN result is saved. Continue to the enrolment form, confirm your details, then proceed to secure Stripe checkout.";
  const enrollmentHref = `/enroll?course=${courseSlug}&lln=passed`;

  async function submitTest() {
    if (!canSubmit) {
      setError("Please answer every question before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/student/lln/${courseSlug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const result = await readJson<SubmitResult>(response);

      if (!response.ok || !result.attempt) {
        throw new Error(result.error ?? "Unable to submit LLN test.");
      }

      setAttempt(result.attempt);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit LLN test.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function retake() {
    setAnswers({});
    setAttempt(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function startCheckout() {
    setIsStartingCheckout(true);
    setCheckoutError(null);

    try {
      const response = await fetch(isUnlockMode ? `/api/student/courses/${courseSlug}/assignments/checkout` : "/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isUnlockMode
            ? { assignmentKey: assignmentKey ?? "all_locked" }
            : { courseSlug },
        ),
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
        throw new Error(result.error ?? "Unable to start secure checkout.");
      }

      window.location.assign(result.url);
    } catch (checkoutStartError) {
      setCheckoutError(
        checkoutStartError instanceof Error
          ? checkoutStartError.message
          : "Unable to start secure checkout.",
      );
    } finally {
      setIsStartingCheckout(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="portal-card overflow-hidden rounded-[28px]">
        <div className="border-b border-[#d9e7f3] bg-[#f7fbff] p-7 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="portal-section-label">Course readiness check</p>
              <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-[#081221] sm:text-4xl">
                Language, literacy, numeracy, and digital readiness check.
              </h1>
              <p className="portal-page-copy mt-3 max-w-3xl">
                Complete this short readiness check before continuing to course assessments.
              </p>
            </div>
            <div className="rounded-[18px] border border-[#d9e7f3] bg-white px-5 py-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6b7d90]">Pass mark</p>
              <p className="mt-1 text-3xl font-black text-[#081221]">60%</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 p-6 sm:p-8">
          {Object.entries(groupedQuestions).map(([section, sectionQuestions]) => (
            <div key={section} className="grid gap-4">
              <h2 className="text-xl font-black tracking-tight text-[#081221]">{section}</h2>
              {sectionQuestions.map((question) => (
                <article
                  key={question.id}
                  className="rounded-[20px] border border-[#d9e7f3] bg-white p-5 shadow-sm"
                >
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0f6eb8]">
                    Question {questions.findIndex((item) => item.id === question.id) + 1}
                  </p>
                  <h3 className="mt-2 text-lg font-black leading-7 text-[#081221]">
                    {question.prompt}
                  </h3>
                  <div className="mt-4 grid gap-3">
                    {question.options.map((option) => {
                      const selected = answers[question.id] === option.id;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            setAnswers((current) => ({
                              ...current,
                              [question.id]: option.id,
                            }))
                          }
                          className={`flex min-h-12 items-center justify-between gap-4 rounded-[14px] border px-4 py-3 text-left text-sm font-bold transition ${
                            selected
                              ? "border-[#0f6eb8] bg-[#eef7ff] text-[#081221] shadow-sm"
                              : "border-[#d9e7f3] bg-[#f9fcff] text-[#5d7389] hover:border-[#0f6eb8]/45"
                          }`}
                        >
                          <span>{option.label}</span>
                          <span
                            className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                              selected ? "border-[#0f6eb8] bg-[#0f6eb8]" : "border-[#b8cadc]"
                            }`}
                          >
                            {selected ? <span className="size-2 rounded-full bg-white" /> : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          ))}

          {error ? (
            <p className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[#d9e7f3] bg-[#f7fbff] p-4">
            <p className="text-sm font-black text-[#5d7389]">
              {answeredCount} of {questions.length} answered
            </p>
            <button
              type="button"
              onClick={submitTest}
              disabled={!canSubmit || isSubmitting}
              className="portal-button-primary inline-flex items-center gap-2 px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ClipboardCheck size={16} />}
              Submit test
            </button>
          </div>
        </div>
      </section>

      <aside className="space-y-5">
        <section className="portal-card rounded-[28px] p-6">
          <div className="flex size-12 items-center justify-center rounded-[16px] bg-[#eef5fb] text-[#0f6eb8]">
            <ShieldCheck size={22} />
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-[#081221]">
            Your LLN status
          </h2>
          {attempt ? (
            <div className="mt-5 rounded-[20px] border border-[#d9e7f3] bg-[#f9fcff] p-5">
              <div className="flex items-center gap-3">
                {attempt.passed ? (
                  <CheckCircle2 className="text-emerald-500" size={24} />
                ) : (
                  <XCircle className="text-rose-500" size={24} />
                )}
                <p className="text-lg font-black text-[#081221]">
                  {attempt.passed ? "Passed" : "Not yet passed"}
                </p>
              </div>
              <p className="mt-3 text-sm font-bold text-[#5d7389]">
                Score: {attempt.score} / {attempt.total} ({Math.round(attempt.score_percent)}%)
              </p>
              <p className="mt-1 text-xs font-bold text-[#7d90a5]">
                Attempted {new Date(attempt.created_at).toLocaleString("en-AU")}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm font-semibold leading-6 text-[#5d7389]">
              Answer all questions and submit when ready. Your result will be checked instantly.
            </p>
          )}

          {latestPassed ? (
            <div className="mt-5 rounded-[20px] border border-emerald-200 bg-emerald-50/70 p-5">
              <p className="text-base font-black leading-6 text-[#081221]">{passedHeading}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d7389]">{passedCopy}</p>
              {isPurchaseMode ? (
                <Link
                  href={enrollmentHref}
                  className="portal-button-primary mt-4 inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm"
                >
                  Continue to enrolment
                  <ArrowRight size={16} />
                </Link>
              ) : isUnlockMode ? (
                <button
                  type="button"
                  onClick={startCheckout}
                  disabled={isStartingCheckout}
                  className="portal-button-primary mt-4 inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isStartingCheckout ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CreditCard size={16} />
                  )}
                  {isStartingCheckout ? "Starting checkout..." : actionLabel}
                </button>
              ) : (
                <Link
                  href={returnTo}
                  className="portal-button-primary mt-4 inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm"
                >
                  Continue
                  <ArrowRight size={16} />
                </Link>
              )}
              {checkoutError ? (
                <p className="mt-3 rounded-[14px] border border-rose-200 bg-white px-3 py-2 text-sm font-bold text-rose-700">
                  {checkoutError}
                </p>
              ) : null}
            </div>
          ) : attempt ? (
            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={retake}
                className="portal-button-primary inline-flex items-center justify-center gap-2 px-5 py-3 text-sm"
              >
                <RotateCcw size={16} />
                Retake test
              </button>
              <Link
                href="/dashboard"
                className="portal-button-secondary inline-flex items-center justify-center gap-2 px-5 py-3 text-sm"
              >
                Go to dashboard
              </Link>
            </div>
          ) : null}
        </section>

        <section className="portal-card rounded-[28px] p-6">
          <h2 className="text-xl font-black tracking-tight text-[#081221]">What happens next?</h2>
          <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-[#5d7389]">
            <p>Pass with 60% or higher to continue to enrolment and secure Stripe checkout.</p>
            <p>If you do not pass, you can retake the test. VCK can also support you if any learning needs come up.</p>
            <p>Reference students keep current Cluster 1 access; this check is only required before buying further access.</p>
          </div>
        </section>
      </aside>
    </div>
  );
}
