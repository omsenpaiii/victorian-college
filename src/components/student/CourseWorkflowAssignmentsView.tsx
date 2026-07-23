"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Download,
  FileCheck2,
  FileText,
  Lock,
  MessageSquareText,
  MonitorPlay,
  PanelLeft,
  ShieldCheck,
} from "lucide-react";
import {
  formatAssignmentStatus,
  type AssignmentStatus,
  type CourseWorkflowAssignmentResource,
  type StudentCourseWorkflowAssignment,
} from "@/lib/course-workflow";
import { AssignmentUnlockPaymentButton } from "@/components/student/AssignmentUnlockPaymentButton";
import { AssignmentUploadForm } from "@/components/student/AssignmentUploadForm";

type CourseWorkflowAssignmentsViewProps = {
  assignments: StudentCourseWorkflowAssignment[];
  mode: "activities" | "resources";
  unlockAmountCents?: number | null;
};

type SectionKey = "introduction" | "learning" | "assessment";

const statusStyles: Record<AssignmentStatus, string> = {
  locked: "bg-slate-100 text-slate-600",
  not_submitted: "bg-[#eef5ff] text-[#0f6eb8]",
  submitted: "bg-[#fff2e8] text-[#f97316]",
  satisfactory: "bg-emerald-50 text-emerald-700",
  not_satisfactory: "bg-rose-50 text-rose-700",
};

const sectionCopy: Record<SectionKey, { title: string; description: string; icon: typeof MonitorPlay }> = {
  introduction: {
    title: "Introduction",
    description: "Preview the cluster slide deck. This presentation is view-only.",
    icon: MonitorPlay,
  },
  learning: {
    title: "Learning Resource",
    description: "Read the learner guide online, or download the PDF or Word version.",
    icon: FileText,
  },
  assessment: {
    title: "Assessment",
    description: "Preview the assessment workbook, download it, then upload your completed work.",
    icon: FileCheck2,
  },
};

function clusterLabel(assignment: StudentCourseWorkflowAssignment) {
  return `Cluster ${assignment.position}`;
}

function resourcesFor(assignment: StudentCourseWorkflowAssignment, key: SectionKey) {
  if (key === "introduction") {
    return assignment.resources.filter((resource) => resource.kind === "slides");
  }

  if (key === "learning") {
    return assignment.resources.filter((resource) => resource.kind === "learning_resource");
  }

  return assignment.resources.filter((resource) => resource.kind === "assessment");
}

function PreviewFrame({ resource }: { resource: CourseWorkflowAssignmentResource }) {
  if (!resource.preview_path) {
    return (
      <div className="rounded-xl border border-dashed border-[#cbd8e6] bg-[#fbfdff] p-5 text-sm font-semibold text-[#5d7389]">
        Preview is being prepared for this resource.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#dbe3ec] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#edf3f8] px-4 py-3">
        <div>
          <h5 className="text-sm font-black text-[#081221]">{resource.title}</h5>
          <p className="mt-1 text-xs font-bold text-[#6b7f95]">
            {resource.kind === "slides" ? "Preview only" : "PDF preview"}
          </p>
        </div>
        <Link
          href={`/api/student/resources/${resource.id}?mode=preview`}
          target="_blank"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#dbe3ec] bg-white px-3 text-xs font-black text-[#0f6eb8]"
        >
          Open
          <ArrowRight size={14} />
        </Link>
      </div>
      <iframe
        title={`${resource.title} preview`}
        src={`/api/student/resources/${resource.id}?mode=preview#toolbar=0&navpanes=0`}
        className="h-[min(68vh,680px)] min-h-[460px] w-full bg-[#f8fbfe]"
      />
    </div>
  );
}

function DownloadButtons({ resource }: { resource: CourseWorkflowAssignmentResource }) {
  if (!resource.downloadable) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {resource.preview_path ? (
        <Link
          href={`/api/student/resources/${resource.id}?mode=download&format=pdf`}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0f6eb8] px-3 text-sm font-black text-white"
        >
          <Download size={15} />
          PDF
        </Link>
      ) : null}
      {resource.original_path ? (
        <Link
          href={`/api/student/resources/${resource.id}?mode=download&format=docx`}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dbe3ec] bg-white px-3 text-sm font-black text-[#0f6eb8]"
        >
          <Download size={15} />
          Word
        </Link>
      ) : null}
    </div>
  );
}

function LockedPanel({
  assignment,
  unlockAmountCents,
}: {
  assignment: StudentCourseWorkflowAssignment;
  unlockAmountCents?: number | null;
}) {
  const paymentsEnabled = Boolean(unlockAmountCents && unlockAmountCents > 0);

  return (
    <div className="rounded-xl border border-dashed border-[#cbd8e6] bg-[#fbfdff] p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <Lock size={18} />
        </span>
        <div>
          <h4 className="text-base font-black text-[#081221]">
            {paymentsEnabled ? "Unlock remaining assessments" : "Payment gateway integration coming soon"}
          </h4>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#5d7389]">
            {assignment.lockReason ??
              "This cluster is locked for now. VCK will enable payment and unlock access shortly."}
          </p>
          <AssignmentUnlockPaymentButton
            courseSlug={assignment.courseSlug}
            assignmentKey={assignment.assignmentKey}
            enabled={paymentsEnabled}
            amountCents={unlockAmountCents}
          />
        </div>
      </div>
    </div>
  );
}

function SubmissionPanel({ assignment }: { assignment: StudentCourseWorkflowAssignment }) {
  const submission = assignment.submission;

  return (
    <div className="space-y-4">
      {submission ? (
        <div className="rounded-xl border border-[#dbe3ec] bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-[#081221]">Latest submission</p>
              <p className="mt-1 text-sm font-semibold text-[#5d7389]">{submission.file_name}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#8ca0b3]">
                {submission.resubmission_count ? `Resubmission ${submission.resubmission_count}` : "First submission"}
              </p>
            </div>
            <span className={`rounded-lg px-3 py-2 text-xs font-black ${statusStyles[assignment.status]}`}>
              {formatAssignmentStatus(assignment.status)}
            </span>
          </div>

          {submission.student_comment ? (
            <div className="mt-4 rounded-xl bg-[#fbfdff] p-4">
              <p className="inline-flex items-center gap-2 text-sm font-black text-[#081221]">
                <MessageSquareText size={16} />
                Your note
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d7389]">
                {submission.student_comment}
              </p>
            </div>
          ) : null}

          {submission.admin_comment ? (
            <div className="mt-4 rounded-xl bg-[#eef5ff] p-4">
              <p className="text-sm font-black text-[#081221]">Assessor comments</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d7389]">
                {submission.admin_comment}
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#cbd8e6] bg-[#fbfdff] p-4 text-sm font-semibold text-[#5d7389]">
          No assessment has been submitted for this cluster yet.
        </div>
      )}

      <AssignmentUploadForm
        courseSlug={assignment.courseSlug}
        assignmentKey={assignment.assignmentKey}
        hasSubmission={Boolean(submission)}
      />
    </div>
  );
}

function ClusterSection({
  assignment,
  sectionKey,
  open,
  onToggle,
}: {
  assignment: StudentCourseWorkflowAssignment;
  sectionKey: SectionKey;
  open: boolean;
  onToggle: () => void;
}) {
  const copy = sectionCopy[sectionKey];
  const Icon = copy.icon;
  const resources = resourcesFor(assignment, sectionKey);

  return (
    <section className="overflow-hidden rounded-xl border border-[#dbe3ec] bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-[#fbfdff]"
      >
        <span className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eef5ff] text-[#0f6eb8]">
            <Icon size={18} />
          </span>
          <span>
            <span className="block text-base font-black text-[#081221]">{copy.title}</span>
            <span className="mt-1 block text-sm font-semibold leading-6 text-[#5d7389]">
              {copy.description}
            </span>
          </span>
        </span>
        <ChevronDown
          size={20}
          className={`shrink-0 text-[#6b7f95] transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="space-y-5 border-t border-[#edf3f8] bg-[#fbfdff] p-5">
          {resources.length ? (
            resources.map((resource) => (
              <div key={resource.id} className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-black text-[#081221]">{resource.title}</h4>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#5d7389]">
                      {resource.description || "Open this resource to support your assessment work."}
                    </p>
                  </div>
                  <DownloadButtons resource={resource} />
                </div>
                <PreviewFrame resource={resource} />
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-[#cbd8e6] bg-white p-5 text-sm font-semibold text-[#5d7389]">
              This section is being prepared.
            </div>
          )}

          {sectionKey === "assessment" ? <SubmissionPanel assignment={assignment} /> : null}
        </div>
      ) : null}
    </section>
  );
}

export function CourseWorkflowAssignmentsView({
  assignments,
  mode,
  unlockAmountCents,
}: CourseWorkflowAssignmentsViewProps) {
  const initialAssignment = useMemo(
    () => assignments.find((assignment) => assignment.unlocked) ?? assignments[0],
    [assignments],
  );
  const [selectedKey, setSelectedKey] = useState(initialAssignment?.assignmentKey ?? "");
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    introduction: mode === "activities",
    learning: mode === "resources",
    assessment: false,
  });

  const selected =
    assignments.find((assignment) => assignment.assignmentKey === selectedKey) ??
    initialAssignment;
  const unlocked = assignments.filter((assignment) => assignment.unlocked).length;
  const satisfactory = assignments.filter((assignment) => assignment.status === "satisfactory").length;
  const submitted = assignments.filter((assignment) =>
    ["submitted", "satisfactory", "not_satisfactory"].includes(assignment.status),
  ).length;

  if (!selected) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-[#cbd8e6] bg-[#fbfdff] p-6 text-sm font-semibold text-[#5d7389]">
        Course assessment content is being prepared.
      </div>
    );
  }

  function toggleSection(sectionKey: SectionKey) {
    setOpenSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }));
  }

  return (
    <div className="mt-5 overflow-hidden rounded-[22px] border border-[#dbe7f2] bg-white shadow-[0_18px_55px_rgba(8,18,33,0.08)]">
      <div className="border-b border-[#e7eff7] bg-[#fbfdff] px-5 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#eaf4ff] text-[#0f6eb8]">
              <PanelLeft size={20} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f6eb8]">
                Course learning workspace
              </p>
              <h3 className="mt-1 text-2xl font-black tracking-tight text-[#081221]">
                Work through each cluster, review resources, and submit your assessment.
              </h3>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-4 xl:min-w-[520px]">
            {[
              { label: "Clusters", value: assignments.length },
              { label: "Unlocked", value: unlocked },
              { label: "Submitted", value: submitted },
              { label: "Satisfactory", value: satisfactory },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-[#dbe7f2] bg-white px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#71869c]">{item.label}</p>
                <p className="mt-1 text-2xl font-black text-[#081221]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid min-h-[760px] lg:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)_310px]">
        <aside className="border-b border-[#e7eff7] bg-[#f7fbff] p-4 lg:border-b-0 lg:border-r">
          <p className="px-2 text-xs font-black uppercase tracking-[0.16em] text-[#6b7f95]">
            Course clusters
          </p>
          <div className="mt-3 grid gap-2">
            {assignments.map((assignment) => {
              const active = assignment.assignmentKey === selected.assignmentKey;
              return (
                <button
                  key={assignment.assignmentKey}
                  type="button"
                  onClick={() => setSelectedKey(assignment.assignmentKey)}
                  className={`group w-full rounded-2xl border p-3 text-left transition ${
                    active
                      ? "border-[#0f6eb8] bg-white shadow-[0_12px_32px_rgba(15,110,184,0.12)]"
                      : "border-transparent bg-transparent hover:border-[#dbe3ec] hover:bg-white"
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black text-[#081221]">{clusterLabel(assignment)}</span>
                    <span className={`flex size-8 items-center justify-center rounded-xl ${
                      assignment.unlocked ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                    }`}>
                      {assignment.unlocked ? <CheckCircle2 size={16} /> : <Lock size={15} />}
                    </span>
                  </span>
                  <span className="mt-2 line-clamp-2 block text-sm font-bold leading-5 text-[#53677d]">
                    {assignment.subtitle}
                  </span>
                  <span className={`mt-3 inline-flex rounded-lg px-2.5 py-1.5 text-[11px] font-black ${statusStyles[assignment.status]}`}>
                    {formatAssignmentStatus(assignment.status)}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="min-w-0 bg-white">
          <header className="border-b border-[#e7eff7] px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f6eb8]">
                  {clusterLabel(selected)}
                </p>
                <h3 className="mt-2 text-3xl font-black tracking-tight text-[#081221]">
                  {selected.subtitle}
                </h3>
                <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-[#53677d]">
                  {selected.overview}
                </p>
              </div>
              <span className={`w-fit rounded-xl px-3 py-2 text-xs font-black ${statusStyles[selected.status]}`}>
                {formatAssignmentStatus(selected.status)}
              </span>
            </div>
          </header>

          <div className="space-y-4 px-5 py-5 sm:px-7">
            {!selected.unlocked ? (
              <LockedPanel assignment={selected} unlockAmountCents={unlockAmountCents} />
            ) : (
              <>
                <div className="rounded-2xl border border-[#dbe7f2] bg-[#f8fbff] p-3">
                  <div className="grid gap-2 md:grid-cols-3">
                    {(["introduction", "learning", "assessment"] as SectionKey[]).map((sectionKey) => {
                      const copy = sectionCopy[sectionKey];
                      const Icon = copy.icon;
                      const open = openSections[sectionKey];
                      return (
                        <button
                          key={sectionKey}
                          type="button"
                          onClick={() => toggleSection(sectionKey)}
                          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                            open
                              ? "border-[#0f6eb8] bg-white shadow-sm"
                              : "border-transparent bg-transparent hover:bg-white"
                          }`}
                        >
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf4ff] text-[#0f6eb8]">
                            <Icon size={18} />
                          </span>
                          <span>
                            <span className="block text-sm font-black text-[#081221]">{copy.title}</span>
                            <span className="mt-0.5 block text-xs font-bold text-[#6b7f95]">
                              {resourcesFor(selected, sectionKey).length || "Pending"} item(s)
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {(["introduction", "learning", "assessment"] as SectionKey[]).map((sectionKey) => (
                  <ClusterSection
                    key={sectionKey}
                    assignment={selected}
                    sectionKey={sectionKey}
                    open={openSections[sectionKey]}
                    onToggle={() => toggleSection(sectionKey)}
                  />
                ))}
              </>
            )}
          </div>
        </main>

        <aside className="hidden border-l border-[#e7eff7] bg-[#fbfdff] p-5 2xl:block">
          <div className="sticky top-24 space-y-4">
            <section className="rounded-2xl border border-[#dbe7f2] bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <p className="text-sm font-black text-[#081221]">Cluster status</p>
                  <p className="mt-0.5 text-xs font-bold text-[#6b7f95]">
                    {formatAssignmentStatus(selected.status)}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-[#f4f8fc] px-3 py-3">
                  <p className="text-2xl font-black text-[#081221]">{unlocked}</p>
                  <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#71869c]">Unlocked</p>
                </div>
                <div className="rounded-xl bg-[#f6fff8] px-3 py-3">
                  <p className="text-2xl font-black text-emerald-600">{satisfactory}</p>
                  <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#71869c]">Passed</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#dbe7f2] bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#eaf4ff] text-[#0f6eb8]">
                  <BookOpen size={18} />
                </span>
                <div>
                  <p className="text-sm font-black text-[#081221]">How to complete</p>
                  <p className="mt-0.5 text-xs font-bold text-[#6b7f95]">Follow the three sections</p>
                </div>
              </div>
              <ol className="mt-4 space-y-3 text-sm font-semibold leading-6 text-[#53677d]">
                <li>1. Watch the introduction preview.</li>
                <li>2. Read the learner resource and keep a copy.</li>
                <li>3. Download, complete, and upload the assessment.</li>
              </ol>
            </section>

            {selected.submission?.admin_comment ? (
              <section className="rounded-2xl border border-[#dbe7f2] bg-white p-4">
                <p className="text-sm font-black text-[#081221]">Latest assessor feedback</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#53677d]">
                  {selected.submission.admin_comment}
                </p>
              </section>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
