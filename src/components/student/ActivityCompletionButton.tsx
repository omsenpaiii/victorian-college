"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, PlayCircle } from "lucide-react";
import { updateStudentActivityProgress } from "@/lib/student-actions";

type ActivityCompletionButtonProps = {
  courseSlug: string;
  activityId: string;
  completed: boolean;
  compact?: boolean;
};

export function ActivityCompletionButton({
  courseSlug,
  activityId,
  completed,
  compact = false,
}: ActivityCompletionButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [intent, setIntent] = useState<"start" | "complete" | null>(null);

  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "flex-wrap"}`}>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setIntent("start");
            await updateStudentActivityProgress({
              courseSlug,
              activityId,
              completed: false,
            });
            setIntent(null);
          })
        }
        className={`inline-flex items-center gap-2 rounded-[14px] border px-4 py-2 text-sm font-black transition ${
          completed
            ? "border-[#d9e7f3] text-[#5d7389]"
            : "border-[#d9e7f3] text-[#0f6eb8]"
        }`}
      >
        {isPending && intent === "start" ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <PlayCircle size={16} />
        )}
        {compact ? "Start" : "Mark started"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setIntent("complete");
            await updateStudentActivityProgress({
              courseSlug,
              activityId,
              completed: true,
            });
            setIntent(null);
          })
        }
        className="inline-flex items-center gap-2 rounded-[14px] bg-[#19b468] px-4 py-2 text-sm font-black text-white shadow-[0_16px_30px_rgba(25,180,104,0.14)] transition"
      >
        {isPending && intent === "complete" ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <CheckCircle2 size={16} />
        )}
        {completed ? "Completed" : compact ? "Complete" : "Mark complete"}
      </button>
    </div>
  );
}
