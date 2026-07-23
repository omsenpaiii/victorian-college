"use client";

import { useActionState } from "react";
import { Loader2, MessageSquareQuote } from "lucide-react";
import { submitStudentFeedback, type StudentActionState } from "@/lib/student-actions";

const initialState: StudentActionState = {};

export function FeedbackForm() {
  const [state, action, isPending] = useActionState(submitStudentFeedback, initialState);

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-black text-[#081221]">
          Subject
          <input
            name="subject"
            placeholder="Example: Need help with course access"
            className="portal-input h-14 px-4"
          />
        </label>
        <label className="grid gap-2 text-sm font-black text-[#081221]">
          Category
          <select
            name="category"
            defaultValue="portal"
            className="portal-input h-14 px-4"
          >
            <option value="portal">Portal experience</option>
            <option value="course">Course support</option>
            <option value="assessment">Assessment clarity</option>
            <option value="resources">Resources</option>
            <option value="technical">Technical issue</option>
          </select>
        </label>
      </div>

      <label className="grid gap-2 text-sm font-black text-[#081221]">
        Feedback
        <textarea
          name="message"
          rows={7}
          placeholder="Tell us what is working well, what feels confusing, or what support you need next."
          className="portal-input rounded-[18px] px-4 py-4"
        />
      </label>

      {state.error ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {state.error}
        </div>
      ) : null}
      {state.success ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {state.success}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="portal-button-primary inline-flex items-center gap-2 px-5 py-3 text-sm"
      >
        {isPending ? <Loader2 size={18} className="animate-spin" /> : <MessageSquareQuote size={18} />}
        Send feedback
      </button>
    </form>
  );
}
