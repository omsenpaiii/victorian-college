"use client";

import { useRef, useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";

type AssignmentUploadFormProps = {
  assignmentKey: string;
  hasSubmission: boolean;
  courseSlug: string;
};

export function AssignmentUploadForm({
  assignmentKey,
  hasSubmission,
  courseSlug,
}: AssignmentUploadFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [studentComment, setStudentComment] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);

    const file = inputRef.current?.files?.[0];

    if (!file) {
      setError("Choose a completed assessment file first.");
      setPending(false);
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    formData.set("studentComment", studentComment);

    const response = await fetch(`/api/student/courses/${courseSlug}/assignments/${assignmentKey}/submit`, {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Upload failed.");
      setPending(false);
      return;
    }

    setMessage("Assessment uploaded. VCK can now review your latest submission.");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setStudentComment("");
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-[#dbe3ec] bg-[#fbfdff] p-4">
      <label className="grid gap-2 text-sm font-black text-[#081221]">
        {hasSubmission ? "Upload a revised assessment" : "Upload completed assessment"}
        <input
          ref={inputRef}
          name="file"
          type="file"
          className="block w-full rounded-[8px] border border-[#dbe3ec] bg-white px-3 py-2 text-sm font-semibold text-[#475569] file:mr-4 file:rounded-[7px] file:border-0 file:bg-[#eef5ff] file:px-3 file:py-2 file:text-sm file:font-black file:text-[#0f6eb8]"
        />
      </label>
      <label className="mt-4 grid gap-2 text-sm font-black text-[#081221]">
        Comment for assessor <span className="font-semibold text-[#6b7f95]">(optional)</span>
        <textarea
          value={studentComment}
          onChange={(event) => setStudentComment(event.target.value)}
          placeholder="Add a short note about your submission or what changed in this resubmission."
          className="min-h-24 rounded-[8px] border border-[#dbe3ec] bg-white px-3 py-3 text-sm font-semibold leading-6 text-[#475569] outline-none focus:border-[#0f6eb8]"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-[#0f6eb8] px-4 text-sm font-black text-white shadow-[0_12px_24px_rgba(15,110,184,0.16)] disabled:opacity-70"
      >
        {pending ? <Loader2 size={17} className="animate-spin" /> : <UploadCloud size={17} />}
        {hasSubmission ? "Replace submission" : "Submit assessment"}
      </button>
      {message ? (
        <p className="mt-3 rounded-[8px] bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-[8px] bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
          {error}
        </p>
      ) : null}
    </form>
  );
}
