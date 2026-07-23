"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Database,
  CreditCard,
  Download,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Plus,
  Pencil,
  Search,
  ShieldCheck,
  RotateCcw,
  Trash2,
  Upload,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import type { AdminUser } from "@/lib/admin";
import type { AdminSnapshot } from "@/lib/admin-data";
import type { AdminStudent } from "@/lib/admin-data";
import { formatAssignmentStatus } from "@/lib/course-workflow";

type AdminPortalProps = {
  admin: AdminUser;
  snapshot: AdminSnapshot;
};

type Section = "dashboard" | "students" | "add-student" | "courses" | "lessons" | "assessments" | "leads" | "payments" | "excel";
type AssessmentStatusFilter =
  | "all"
  | "submitted"
  | "satisfactory"
  | "not_satisfactory"
  | "not_submitted"
  | "locked";

const navItems: { id: Section; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "students", label: "Students", icon: Users },
  { id: "add-student", label: "Add Student", icon: UserPlus },
  { id: "courses", label: "Courses", icon: GraduationCap },
  { id: "lessons", label: "Lessons", icon: BookOpen },
  { id: "assessments", label: "Assessments", icon: ClipboardCheck },
  { id: "leads", label: "Leads", icon: Database },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "excel", label: "Excel", icon: FileSpreadsheet },
];

const exportEntities = ["courses", "students", "enrollments", "leads"] as const;

function money(centsOrDollars: number | null | undefined) {
  if (!centsOrDollars) return "$0";
  return `$${Number(centsOrDollars).toLocaleString("en-AU")}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function matchesAssessmentStatus(status: string, filter: AssessmentStatusFilter) {
  if (filter === "all") return true;
  if (filter === "submitted") {
    return status === "submitted" || status === "satisfactory" || status === "not_satisfactory";
  }
  return status === filter;
}

const studentNameCollator = new Intl.Collator("en-AU", { sensitivity: "base", numeric: true });

function studentDisplayName(student: AdminStudent) {
  return `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || student.email || "Unnamed";
}

export function AdminPortal({ admin, snapshot: initialSnapshot }: AdminPortalProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [active, setActive] = useState<Section>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [studentView, setStudentView] = useState<"active" | "archived">("active");
  const [editingStudent, setEditingStudent] = useState<AdminStudent | null>(null);
  const [editingCourse, setEditingCourse] = useState<AdminSnapshot["courses"][number] | null>(null);
  const [courseView, setCourseView] = useState<"active" | "archived">("active");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [assessmentQuery, setAssessmentQuery] = useState("");
  const [assessmentStatus, setAssessmentStatus] = useState<AssessmentStatusFilter>("all");
  const [assessmentCluster, setAssessmentCluster] = useState("all");
  const [assessmentSource, setAssessmentSource] = useState("all");
  const [assessmentBatch, setAssessmentBatch] = useState("all");
  const [selectedCourseSlug, setSelectedCourseSlug] = useState(initialSnapshot.courses[0]?.slug ?? "");
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSidebarCollapsed(window.localStorage.getItem("vck-admin-sidebar-collapsed") === "true");
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("vck-admin-sidebar-collapsed", String(next));
      return next;
    });
  }

  const courseBySlug = useMemo(
    () => new Map(snapshot.courses.map((course) => [course.slug, course])),
    [snapshot.courses],
  );
  const totalRevenue = snapshot.payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + payment.amount_cents, 0) / 100;
  const activeEnrollments = snapshot.enrollments.filter((item) => item.status === "active").length;
  const completedCount = snapshot.enrollments.filter((item) => item.status === "refunded").length;
  const filteredCourses = snapshot.courses.filter((course) => {
    if (courseView === "active" ? !course.isActive : course.isActive) return false;
    const value = `${course.title} ${course.code} ${course.category}`.toLowerCase();
    return value.includes(query.toLowerCase());
  });
  const filteredStudents = snapshot.students
    .filter((student) => (studentView === "archived" ? Boolean(student.archived_at) : !student.archived_at))
    .filter((student) => {
      const value = `${student.first_name ?? ""} ${student.last_name ?? ""} ${student.email ?? ""} ${student.phone ?? ""}`.toLowerCase();
      return value.includes(query.trim().toLowerCase());
    })
    .sort((a, b) => {
      const nameResult = studentNameCollator.compare(studentDisplayName(a), studentDisplayName(b));
      return nameResult || studentNameCollator.compare(a.email ?? "", b.email ?? "");
    });
  const activeCourses = snapshot.courses.filter((course) => course.isActive);
  const courseBreakdown = activeCourses.slice(0, 9).map((course) => {
    const count = snapshot.enrollments.filter((item) => item.course_slug === course.slug).length;
    return { course, count };
  });
  const monthlyEnrollmentCounts = Array.from({ length: 12 }).map((_, index) =>
    snapshot.enrollments.filter((item) => {
      const date = new Date(item.created_at);
      return date.getMonth() === index;
    }).length,
  );
  const maxMonthlyEnrollment = Math.max(1, ...monthlyEnrollmentCounts);
  const assessmentSources = Array.from(
    new Set(snapshot.courseWorkflow.students.map((student) => student.source).filter(Boolean) as string[]),
  ).sort((a, b) => a.localeCompare(b));
  const assessmentBatches = Array.from(
    new Set(snapshot.courseWorkflow.students.map((student) => student.batchNumber ?? 2)),
  ).sort((a, b) => a - b);
  const filteredCourseWorkflowStudents = snapshot.courseWorkflow.students
    .map((student) => {
      const name = `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim() || student.email || student.userKey;
      const haystack = `${name} ${student.email ?? ""} ${student.phone ?? ""}`.toLowerCase();
      const matchesSearch = haystack.includes(assessmentQuery.trim().toLowerCase());
      const matchesSource = assessmentSource === "all" || student.source === assessmentSource;
      const matchesBatch = assessmentBatch === "all" || String(student.batchNumber ?? 2) === assessmentBatch;
      const assignments = student.assignments
        .filter((assignment) => assessmentCluster === "all" || String(assignment.position) === assessmentCluster)
        .filter((assignment) => matchesAssessmentStatus(assignment.status, assessmentStatus))
        .sort((a, b) => {
          const aSubmitted = a.submission ? 1 : 0;
          const bSubmitted = b.submission ? 1 : 0;
          if (aSubmitted !== bSubmitted) return bSubmitted - aSubmitted;
          return a.position - b.position;
        });

      return { ...student, displayName: name, assignments, matchesSearch, matchesSource, matchesBatch };
    })
    .filter((student) => student.matchesSearch && student.matchesSource && student.matchesBatch && student.assignments.length)
    .sort((a, b) => {
      if (assessmentStatus === "submitted") {
        const aNeedsReview = a.assignments.some((assignment) => assignment.status === "submitted") ? 1 : 0;
        const bNeedsReview = b.assignments.some((assignment) => assignment.status === "submitted") ? 1 : 0;
        if (aNeedsReview !== bNeedsReview) return bNeedsReview - aNeedsReview;
      }
      const nameResult = studentNameCollator.compare(a.displayName, b.displayName);
      return nameResult || studentNameCollator.compare(a.email ?? "", b.email ?? "");
    });
  const editingCourseSlug = editingStudent
    ? snapshot.enrollments.find(
        (enrollment) => enrollment.user_key === editingStudent.user_key && enrollment.status === "active",
      )?.course_slug ?? ""
    : "";
  const metricCards: { label: string; value: string; icon: LucideIcon }[] = [
    { label: "Total Students", value: String(snapshot.students.filter((student) => !student.archived_at).length), icon: Users },
    { label: "Active Enrolments", value: String(activeEnrollments), icon: GraduationCap },
    { label: "Completed", value: String(completedCount), icon: BookOpen },
    { label: "Revenue", value: money(totalRevenue), icon: Database },
  ];
  const originCounts = snapshot.students.filter((student) => !student.archived_at).reduce(
    (counts, student) => ({ ...counts, [student.origin]: counts[student.origin] + 1 }),
    { admin: 0, import: 0, self_enrolled: 0 },
  );
  const unreadNotifications = snapshot.notifications.filter((notification) => !notification.read);
  const enrollmentSearchResults = snapshot.enrollments.map((enrollment) => {
    const student = snapshot.students.find((item) => item.user_key === enrollment.user_key);
    const course = courseBySlug.get(enrollment.course_slug);
    return {
      label: student ? studentDisplayName(student) : enrollment.user_key,
      meta: `Enrolment · ${course?.title ?? enrollment.course_slug} · ${enrollment.status}`,
      haystack: `${student ? studentDisplayName(student) : ""} ${student?.email ?? ""} ${course?.title ?? ""} ${enrollment.course_slug} ${enrollment.status}`.toLowerCase(),
      section: "students" as Section,
    };
  });
  const assessmentSearchResults = snapshot.courseWorkflow.students.flatMap((student) =>
    student.assignments.map((assignment) => ({
      label: `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim() || student.email || "Learner",
      meta: `Assessment · Cluster ${assignment.position} · ${assignment.status.replaceAll("_", " ")}`,
      haystack: `${student.firstName ?? ""} ${student.lastName ?? ""} ${student.email ?? ""} cluster ${assignment.position} ${assignment.title} ${assignment.status}`.toLowerCase(),
      section: "assessments" as Section,
    })),
  );
  const universalResults = query.trim() ? [
    ...snapshot.students.filter((student) => `${studentDisplayName(student)} ${student.email ?? ""} ${student.phone ?? ""}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5).map((student) => ({ label: studentDisplayName(student), meta: student.email ?? "Student", section: "students" as Section })),
    ...snapshot.courses.filter((course) => `${course.title} ${course.code} ${course.slug}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5).map((course) => ({ label: course.title, meta: course.code, section: "courses" as Section })),
    ...snapshot.leads.filter((lead) => `${lead.first_name} ${lead.last_name} ${lead.email}`.toLowerCase().includes(query.toLowerCase())).slice(0, 4).map((lead) => ({ label: `${lead.first_name} ${lead.last_name}`, meta: `Lead · ${lead.email}`, section: "leads" as Section })),
    ...enrollmentSearchResults.filter((item) => item.haystack.includes(query.toLowerCase())).slice(0, 4),
    ...assessmentSearchResults.filter((item) => item.haystack.includes(query.toLowerCase())).slice(0, 4),
    ...snapshot.payments.filter((payment) => `${payment.email ?? ""} ${payment.course_slug} ${payment.status}`.toLowerCase().includes(query.toLowerCase())).slice(0, 4).map((payment) => ({ label: payment.email ?? "Stripe payment", meta: `${payment.status} · ${payment.course_slug}`, section: "payments" as Section })),
  ].slice(0, 12) : [];

  async function runAction(action: string, payload: unknown, success: string) {
    setNotice(null);
    const response = await fetch("/api/admin/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
    const json = await response.json();

    if (!response.ok) {
      setNotice({ type: "error", text: json.error ?? "Admin action failed." });
      return false;
    }

    setSnapshot(json.snapshot);
    setNotice({ type: "success", text: success });
    return true;
  }

  async function handleCourseSubmit(formData: FormData) {
    const title = String(formData.get("title") ?? "");
    const saved = await runAction(
      "upsert-course",
      {
        slug: String(formData.get("slug") || slugify(title)),
        code: String(formData.get("code") || "VCK"),
        title,
        category: String(formData.get("category") || "Other"),
        label: String(formData.get("label") || "Course"),
        priceAud: Number(formData.get("priceAud") || 0),
        enrolmentFee: formData.get("enrolmentFee") ? Number(formData.get("enrolmentFee")) : null,
        duration: String(formData.get("duration") || ""),
        description: String(formData.get("description") || ""),
        overview: String(formData.get("overview") || formData.get("description") || ""),
        image: String(formData.get("image") || ""),
        availability: String(formData.get("availability") || "open"),
        deliveryModes: String(formData.get("deliveryModes") || "").split(/\r?\n|,/).filter(Boolean),
        entryRequirements: String(formData.get("entryRequirements") || "").split(/\r?\n|,/).filter(Boolean),
        careerOutcomes: String(formData.get("careerOutcomes") || "").split(/\r?\n|,/).filter(Boolean),
        unitSummary: String(formData.get("unitSummary") || ""),
      },
      "Course saved to Supabase.",
    );
    if (saved) setEditingCourse(null);
  }

  async function handleStudentSubmit(formData: FormData) {
    const saved = await runAction(
      "upsert-student",
      {
        id: editingStudent?.id,
        userKey: editingStudent?.user_key,
        firstName: String(formData.get("firstName") || ""),
        lastName: String(formData.get("lastName") || ""),
        email: String(formData.get("email") || ""),
        phone: String(formData.get("phone") || ""),
        dob: String(formData.get("dob") || ""),
        usi: String(formData.get("usi") || "").toUpperCase(),
        address: String(formData.get("address") || ""),
        disabilityStatus: String(formData.get("disabilityStatus") || ""),
        disabilityDetails: String(formData.get("disabilityDetails") || ""),
        origin: String(formData.get("origin") || "admin"),
        referredBy: String(formData.get("referredBy") || ""),
        batchNumber: Number(formData.get("batchNumber") || 2),
        courseSlug: String(formData.get("courseSlug") || ""),
        status: "active",
      },
      "Student saved and access updated.",
    );

    if (saved) {
      setEditingStudent(null);
      setStudentView("active");
      setActive("students");
    }
  }

  async function archiveCourse(slug: string) {
    if (!window.confirm("Archive this course? Existing enrolments, payments, lessons, and URLs will be preserved.")) return;
    await runAction("archive-course", { slug }, "Course archived.");
  }

  async function restoreCourse(slug: string) {
    await runAction("restore-course", { slug }, "Course restored.");
  }

  async function openNotification(eventKey: string, section: Section) {
    await runAction("mark-notification-read", { eventKey }, "Notification marked as read.");
    setActive(section);
    setNotificationOpen(false);
  }

  async function markAllNotificationsRead() {
    await runAction("mark-all-notifications-read", { eventKeys: unreadNotifications.map((item) => item.eventKey) }, "All notifications marked as read.");
  }

  async function archiveStudent(student: AdminStudent) {
    if (!window.confirm(`Remove ${studentDisplayName(student)} from active students and revoke their course access? Their history will be preserved.`)) {
      return;
    }

    await runAction("archive-student", { id: student.id }, "Student archived and access revoked.");
  }

  async function restoreStudent(student: AdminStudent) {
    if (!window.confirm(`Restore ${studentDisplayName(student)} and reactivate their archived enrolments?`)) {
      return;
    }

    await runAction("restore-student", { id: student.id }, "Student restored.");
  }

  function startAddingStudent() {
    setEditingStudent(null);
    setActive("add-student");
  }

  function startEditingStudent(student: AdminStudent) {
    setEditingStudent(student);
    setActive("add-student");
  }

  async function handleLessonSubmit(formData: FormData) {
    await runAction(
      "upsert-lesson",
      {
        courseSlug: String(formData.get("courseSlug") || ""),
        title: String(formData.get("title") || ""),
        duration: String(formData.get("duration") || ""),
        videoProvider: String(formData.get("videoProvider") || "youtube"),
        videoUrl: String(formData.get("videoUrl") || ""),
        isPreview: formData.get("isPreview") === "on",
      },
      "Lesson saved.",
    );
  }

  async function handleImport(entity: string) {
    const file = fileRef.current?.files?.[0];

    if (!file) {
      setNotice({ type: "error", text: "Choose an Excel file first." });
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    const response = await fetch(`/api/admin/import?entity=${entity}`, {
      method: "POST",
      body: formData,
    });
    const json = await response.json();

    if (!response.ok) {
      setNotice({ type: "error", text: json.errors?.join(" ") || json.error || "Import failed." });
      return;
    }

    const dataResponse = await fetch("/api/admin/data");
    setSnapshot(await dataResponse.json());
    setNotice({ type: "success", text: `Imported ${json.updated} ${entity} rows.` });
  }

  async function handleAssignmentReview(formData: FormData) {
    await runAction(
      "review-assignment",
      {
        submissionId: String(formData.get("submissionId") || ""),
        status: String(formData.get("status") || "not_satisfactory"),
        adminComment: String(formData.get("adminComment") || ""),
      },
      "Assessment review saved.",
    );
  }

  async function toggleAssignmentAccess(userKey: string, assignmentKey: string, unlocked: boolean) {
    await runAction(
      "update-assignment-access",
      { userKey, assignmentKey, unlocked },
      unlocked ? "Assignment unlocked." : "Assignment locked.",
    );
  }

  async function handleAdminAssignmentUpload(formData: FormData) {
    setNotice(null);
    const response = await fetch("/api/admin/assignments/upload", {
      method: "POST",
      body: formData,
    });
    const json = await response.json();

    if (!response.ok) {
      setNotice({ type: "error", text: json.error ?? "Unable to upload assessment." });
      return;
    }

    setSnapshot(json.snapshot);
    setNotice({ type: "success", text: "Assessment uploaded for learner." });
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#101827]">
      {notice ? (
        <div
          className={`fixed right-6 top-6 z-50 rounded-xl px-5 py-4 text-sm font-black shadow-lg ${
            notice.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
          }`}
        >
          {notice.text}
        </div>
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 hidden flex-col bg-[#111c2b] text-white transition-[width] duration-200 lg:flex ${
          sidebarCollapsed ? "w-[84px]" : "w-[260px]"
        }`}
      >
        <div className={`flex h-24 items-center gap-4 ${sidebarCollapsed ? "justify-center px-3" : "px-7"}`}>
          <span className="flex size-12 items-center justify-center rounded-xl bg-[#2e7af0]">
            <ShieldCheck size={26} />
          </span>
          <span className={sidebarCollapsed ? "hidden" : "block"}>
            <span className="block text-xl font-black">VCK</span>
            <span className="block text-sm font-bold text-white/52">Admin Portal</span>
          </span>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const selected = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => (item.id === "add-student" ? startAddingStudent() : setActive(item.id))}
                title={sidebarCollapsed ? item.label : undefined}
                aria-label={item.label}
                className={`flex h-14 w-full items-center rounded-xl text-left text-base font-black transition ${
                  sidebarCollapsed ? "justify-center px-0" : "gap-4 px-5"
                } ${
                  selected ? "bg-[#2392ee] text-white shadow-lg shadow-blue-950/20" : "text-white/58 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Icon size={22} />
                <span className={sidebarCollapsed ? "sr-only" : "block"}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
            onClick={toggleSidebar}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`mb-3 flex h-12 w-full items-center rounded-xl text-left font-bold text-white/52 hover:bg-white/8 hover:text-white ${
              sidebarCollapsed ? "justify-center px-0" : "gap-4 px-4"
            }`}
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            <span className={sidebarCollapsed ? "sr-only" : "block"}>Collapse</span>
          </button>
          <SignOutButton
            title={sidebarCollapsed ? "Sign out" : undefined}
            className={`flex h-12 w-full items-center rounded-xl text-left font-bold text-white/52 hover:bg-white/8 hover:text-white disabled:cursor-wait disabled:opacity-70 ${
              sidebarCollapsed ? "justify-center px-0" : "gap-4 px-4"
            }`}
          >
            <LogOut size={20} /> <span className={sidebarCollapsed ? "sr-only" : "block"}>Sign Out</span>
          </SignOutButton>
        </div>
      </aside>

      <section className={`transition-[padding] duration-200 ${sidebarCollapsed ? "lg:pl-[84px]" : "lg:pl-[260px]"}`}>
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/92 px-5 backdrop-blur lg:px-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setSearchOpen(false);
                if (event.key === "Enter" && universalResults[0]) {
                  setActive(universalResults[0].section);
                  setSearchOpen(false);
                }
              }}
              placeholder="Search students, courses, leads, payments..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-base font-bold outline-none transition focus:border-[#2392ee] focus:bg-white"
            />
            {searchOpen && query.trim() ? (
              <div className="absolute left-0 right-0 top-14 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                {universalResults.length ? universalResults.map((result, index) => (
                  <button
                    key={`${result.section}-${result.label}-${index}`}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setActive(result.section);
                      setSearchOpen(false);
                    }}
                    className="flex w-full items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"
                  >
                    <span className="font-black text-slate-900">{result.label}</span>
                    <span className="text-xs font-bold text-slate-500">{result.meta}</span>
                  </button>
                )) : <p className="p-4 text-sm font-bold text-slate-500">No operational records found.</p>}
              </div>
            ) : null}
          </div>
          <div className="ml-4 flex items-center gap-4">
            <div className="relative">
            <button type="button" onClick={() => setNotificationOpen((current) => !current)} className="relative flex size-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500" aria-label="Open operational notifications">
              <Bell size={22} />
              {unreadNotifications.length ? <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#f5b800] text-xs font-black text-[#101827]">{unreadNotifications.length}</span> : null}
            </button>
            {notificationOpen ? (
              <div className="absolute right-0 top-14 z-50 w-[min(390px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 p-4">
                  <div><p className="font-black">Operational inbox</p><p className="text-xs font-bold text-slate-500">{unreadNotifications.length} unread</p></div>
                  <button type="button" onClick={markAllNotificationsRead} disabled={!unreadNotifications.length} className="text-xs font-black text-[#1f7ac1] disabled:opacity-40">Mark all read</button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {snapshot.notifications.slice(0, 20).map((notification) => (
                    <button key={notification.eventKey} type="button" onClick={() => openNotification(notification.eventKey, notification.section)} className={`block w-full border-b border-slate-100 p-4 text-left last:border-0 hover:bg-slate-50 ${notification.read ? "opacity-60" : "bg-blue-50/40"}`}>
                      <p className="text-sm font-black">{notification.title}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">{notification.detail}</p>
                      <p className="mt-2 text-[11px] font-bold text-slate-400">{new Date(notification.createdAt).toLocaleString("en-AU")}</p>
                    </button>
                  ))}
                  {!snapshot.notifications.length ? <p className="p-6 text-center text-sm font-bold text-slate-500">You are all caught up.</p> : null}
                </div>
              </div>
            ) : null}
            </div>
            <span className="hidden items-center gap-3 sm:flex">
              <span className="flex size-12 items-center justify-center rounded-full bg-[#1f7ac1] text-sm font-black text-white">
                {admin.initials}
              </span>
              <span>
                <span className="block font-black">{admin.name}</span>
                <span className="block text-sm font-bold text-slate-500">{admin.email}</span>
              </span>
            </span>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          {!snapshot.isSupabaseConfigured ? (
            <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
              Supabase is not configured, so the portal is showing fallback course data and mutations are disabled until environment keys are added.
            </div>
          ) : null}

          {active === "dashboard" ? (
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-black tracking-normal">Dashboard</h1>
                <p className="mt-2 text-lg font-bold text-slate-500">
                  Overview of VCK student enrolment and operations.
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {metricCards.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
                    <div className="flex items-start justify-between">
                      <span className="text-lg font-black text-slate-500">{label}</span>
                      <span className="flex size-12 items-center justify-center rounded-xl bg-[#eef4fb] text-[#1f7ac1]">
                        <Icon size={24} />
                      </span>
                    </div>
                    <div className="mt-5 text-4xl font-black">{value}</div>
                    <div className="mt-5 text-sm font-black text-slate-500">
                      <span className="mr-3 rounded-full bg-emerald-50 px-3 py-1 text-emerald-600">+ live</span>
                      from Supabase
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ["Admin added", originCounts.admin],
                  ["Excel imported", originCounts.import],
                  ["Self enrolled", originCounts.self_enrolled],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                    <span className="text-sm font-black text-slate-500">{label}</span>
                    <span className="text-2xl font-black text-[#1f7ac1]">{value}</span>
                  </div>
                ))}
              </div>
              <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
                <section className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black">Enrollment Trends</h2>
                      <p className="mt-1 text-sm font-bold text-slate-500">Monthly active enrollment volume</p>
                    </div>
                    <span className="rounded-full bg-[#eef4fb] px-3 py-1 text-xs font-black text-[#1f7ac1]">
                      Max {maxMonthlyEnrollment}
                    </span>
                  </div>
                  <div className="mt-6 grid h-72 grid-cols-[42px_1fr] gap-3">
                    <div className="flex flex-col justify-between border-r border-dashed border-slate-200 pr-3 text-right text-xs font-black text-slate-400">
                      <span>{maxMonthlyEnrollment}</span>
                      <span>{Math.ceil(maxMonthlyEnrollment / 2)}</span>
                      <span>0</span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 grid grid-rows-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <span key={index} className="border-t border-dashed border-slate-100" />
                        ))}
                      </div>
                      <div className="relative flex h-full items-end gap-2 pb-7">
                        {monthlyEnrollmentCounts.map((monthCount, index) => {
                          const height = Math.max(8, Math.round((monthCount / maxMonthlyEnrollment) * 220));
                      return (
                        <div key={index} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                          <div
                            className="w-full max-w-9 rounded-t-lg bg-[#1f7ac1]/80 transition"
                            style={{ height: `${height}px` }}
                            title={`${monthCount} enrollments`}
                          />
                          <span className="text-[11px] font-bold text-slate-500">
                            {new Date(2026, index, 1).toLocaleDateString("en-AU", { month: "short" })}
                          </span>
                        </div>
                      );
                    })}
                      </div>
                    </div>
                  </div>
                </section>
                <section className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
                  <h2 className="text-2xl font-black">Course Breakdown</h2>
                  <div className="mt-7 space-y-5">
                    {courseBreakdown.map(({ course, count }) => (
                      <div key={course.slug}>
                        <div className="mb-2 flex justify-between gap-4 text-sm font-black">
                          <span>{course.title}</span>
                          <span className="text-slate-500">{count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#2e7af0]"
                            style={{ width: `${Math.min(100, Math.max(8, count * 12))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          ) : null}

          {active === "students" ? (
            <StudentTableSection
              students={filteredStudents}
              view={studentView}
              activeCount={snapshot.students.filter((student) => !student.archived_at).length}
              archivedCount={snapshot.students.filter((student) => Boolean(student.archived_at)).length}
              onViewChange={setStudentView}
              onAdd={startAddingStudent}
              onEdit={startEditingStudent}
              onArchive={archiveStudent}
              onRestore={restoreStudent}
            />
          ) : null}

          {active === "add-student" ? (
            <FormSection
              title={editingStudent ? "Edit Student" : "Add Student"}
              description={editingStudent ? "Update student details without changing their internal access identity." : "Create a student profile and optionally grant course access."}
            >
              <form key={editingStudent?.id ?? "new-student"} action={handleStudentSubmit} className="grid gap-5 md:grid-cols-2">
                <TextField name="firstName" label="First name" required defaultValue={editingStudent?.first_name ?? ""} />
                <TextField name="lastName" label="Last name (optional)" defaultValue={editingStudent?.last_name ?? ""} />
                <TextField name="email" label="Email address" type="email" required defaultValue={editingStudent?.email ?? ""} />
                <TextField name="phone" label="Phone number" defaultValue={editingStudent?.phone ?? ""} />
                <TextField name="dob" label="Date of birth (optional)" type="date" defaultValue={editingStudent?.date_of_birth ?? ""} />
                <TextField name="usi" label="USI (optional, 10 characters)" defaultValue={editingStudent?.usi ?? ""} />
                <TextField name="address" label="Residential address (optional)" defaultValue={editingStudent?.residential_address ?? ""} />
                <TextField name="batchNumber" label="Batch number" type="number" defaultValue={String(editingStudent?.batch_number ?? 2)} />
                <TextField name="referredBy" label="Referred by (optional)" defaultValue={editingStudent?.referred_by ?? ""} />
                <label className="grid gap-2 text-sm font-black text-slate-700">
                  Origin
                  <select name="origin" defaultValue={editingStudent?.origin ?? "admin"} className="h-12 rounded-xl border border-slate-200 px-4 font-bold">
                    <option value="admin">Admin added</option>
                    <option value="import">Excel import</option>
                    <option value="self_enrolled">Self enrolled</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-black text-slate-700">
                  Disability / support status (optional)
                  <select name="disabilityStatus" defaultValue={editingStudent?.disability_status ?? ""} className="h-12 rounded-xl border border-slate-200 px-4 font-bold">
                    <option value="">Not recorded</option>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-black text-slate-700 md:col-span-2">
                  Support details (optional)
                  <textarea name="disabilityDetails" defaultValue={editingStudent?.disability_details ?? ""} className="min-h-24 rounded-xl border border-slate-200 p-4 font-bold" />
                </label>
                <label className="grid gap-2 text-sm font-black text-slate-700 md:col-span-2">
                  Course access {editingStudent ? "(optional update)" : ""}
                  <select name="courseSlug" defaultValue={editingCourseSlug} className="h-12 rounded-xl border border-slate-200 px-4 font-bold">
                    <option value="">No course access yet</option>
                    {activeCourses.map((course) => (
                      <option key={course.slug} value={course.slug}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-wrap gap-3 md:col-span-2">
                  <SubmitButton label={editingStudent ? "Save Changes" : "Save Student"} />
                  {editingStudent ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStudent(null);
                        setActive("students");
                      }}
                      className="inline-flex h-12 items-center rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-600"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </form>
            </FormSection>
          ) : null}

          {active === "courses" ? (
            <div className="space-y-8">
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
                  <div><h1 className="text-3xl font-black">Courses</h1><div className="mt-3 flex gap-2">{(["active", "archived"] as const).map((view) => <button key={view} onClick={() => setCourseView(view)} className={`rounded-lg px-3 py-2 text-xs font-black capitalize ${courseView === view ? "bg-[#eaf4fd] text-[#126fb8]" : "bg-slate-50 text-slate-500"}`}>{view}</button>)}</div></div>
                  <button onClick={() => setEditingCourse(null)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1f7ac1] px-4 text-sm font-black text-white"><Plus size={18} /> New Course</button>
                </div>
                <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="bg-slate-50 text-xs font-black uppercase text-slate-500"><tr>{["Code","Title","Category","Price","Duration","Actions"].map((item) => <th key={item} className="px-6 py-4">{item}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filteredCourses.map((course) => <tr key={course.slug} className="text-sm font-bold"><td className="px-6 py-4">{course.code}</td><td className="px-6 py-4 font-black">{course.title}</td><td className="px-6 py-4">{course.category}</td><td className="px-6 py-4">{money(course.priceAud)}</td><td className="px-6 py-4">{course.duration}</td><td className="px-6 py-4"><div className="flex gap-2">{course.isActive ? <><button type="button" onClick={() => setEditingCourse(course)} className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-[#1f7ac1]" aria-label={`Edit ${course.title}`}><Pencil size={16} /></button><button type="button" onClick={() => archiveCourse(course.slug)} className="flex size-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600" aria-label={`Archive ${course.title}`}><Trash2 size={16} /></button></> : <button type="button" onClick={() => restoreCourse(course.slug)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-200 px-3 text-xs font-black text-emerald-700"><RotateCcw size={15} /> Restore</button>}</div></td></tr>)}{!filteredCourses.length ? <tr><td colSpan={6} className="px-6 py-10 text-center text-sm font-bold text-slate-500">No {courseView} courses found.</td></tr> : null}</tbody></table></div>
              </section>
              <FormSection title={editingCourse ? "Edit Course" : "Add Course"} description={editingCourse ? "The slug is fixed to preserve public URLs and historical relationships." : "Create a new course for the public and student catalogues."}>
                <form key={editingCourse?.slug ?? "new-course"} action={handleCourseSubmit} className="grid gap-5 md:grid-cols-2">
                  <TextField name="title" label="Course title" required defaultValue={editingCourse?.title ?? ""} />
                  <TextField name="slug" label="Slug" defaultValue={editingCourse?.slug ?? ""} readOnly={Boolean(editingCourse)} />
                  <TextField name="code" label="Code" defaultValue={editingCourse?.code ?? "VCK"} />
                  <TextField name="category" label="Category" defaultValue={editingCourse?.category ?? "Security"} />
                  <TextField name="label" label="Label" defaultValue={editingCourse?.label ?? "Course"} />
                  <TextField name="priceAud" label="Price AUD" type="number" defaultValue={String(editingCourse?.priceAud ?? 100)} />
                  <TextField name="enrolmentFee" label="Enrolment fee" type="number" defaultValue={editingCourse?.enrolmentFee ? String(editingCourse.enrolmentFee) : ""} />
                  <TextField name="duration" label="Duration" defaultValue={editingCourse?.duration ?? "1 day"} />
                  <TextField name="image" label="Image URL" defaultValue={editingCourse?.image ?? ""} />
                  <label className="grid gap-2 text-sm font-black text-slate-700">
                    Availability
                    <select name="availability" defaultValue={editingCourse?.availability ?? "open"} className="h-12 rounded-xl border border-slate-200 px-4 font-bold">
                      <option value="open">Open</option>
                      <option value="coming-soon">Coming soon</option>
                      <option value="details-to-follow">Details to follow</option>
                    </select>
                  </label>
                  <TextArea name="description" label="Description" required defaultValue={editingCourse?.description ?? ""} />
                  <TextArea name="overview" label="Overview" defaultValue={editingCourse?.overview ?? ""} />
                  <TextArea name="deliveryModes" label="Delivery modes" placeholder="One per line or comma separated" defaultValue={editingCourse?.deliveryModes.join("\n") ?? ""} />
                  <TextArea name="entryRequirements" label="Entry requirements" defaultValue={editingCourse?.entryRequirements.join("\n") ?? ""} />
                  <TextArea name="careerOutcomes" label="Career outcomes" defaultValue={editingCourse?.careerOutcomes.join("\n") ?? ""} />
                  <TextArea name="unitSummary" label="Unit summary" defaultValue={editingCourse?.unitSummary ?? ""} />
                  <div className="flex gap-3"><SubmitButton label={editingCourse ? "Save Changes" : "Add Course"} />{editingCourse ? <button type="button" onClick={() => setEditingCourse(null)} className="h-12 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-600">Cancel</button> : null}</div>
                </form>
              </FormSection>
            </div>
          ) : null}

          {active === "lessons" ? (
            <FormSection title="Lessons" description="Add or update video lessons for a course.">
              <form action={handleLessonSubmit} className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-black text-slate-700 md:col-span-2">
                  Course
                  <select
                    name="courseSlug"
                    value={selectedCourseSlug}
                    onChange={(event) => setSelectedCourseSlug(event.target.value)}
                    className="h-12 rounded-xl border border-slate-200 px-4 font-bold"
                  >
                    {activeCourses.map((course) => (
                      <option key={course.slug} value={course.slug}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </label>
                <TextField name="title" label="Lesson title" required />
                <TextField name="duration" label="Duration" defaultValue="10:00" />
                <label className="grid gap-2 text-sm font-black text-slate-700">
                  Video provider
                  <select name="videoProvider" className="h-12 rounded-xl border border-slate-200 px-4 font-bold">
                    <option value="youtube">YouTube</option>
                    <option value="google-drive">Google Drive</option>
                  </select>
                </label>
                <TextField name="videoUrl" label="Video URL" type="url" required />
                <label className="flex items-center gap-3 text-sm font-black text-slate-700">
                  <input name="isPreview" type="checkbox" className="size-5" />
                  Free preview lesson
                </label>
                <SubmitButton label="Save Lesson" />
              </form>
              <div className="mt-8 divide-y divide-slate-100 rounded-xl border border-slate-200">
                {(courseBySlug.get(selectedCourseSlug)?.lessons ?? []).map((lesson, index) => (
                  <div key={lesson.id} className="flex items-center justify-between gap-4 p-4">
                    <div>
                      <p className="font-black">{index + 1}. {lesson.title}</p>
                      <p className="text-sm font-bold text-slate-500">{lesson.duration} · {lesson.videoProvider}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                      {lesson.isPreview ? "Preview" : "Locked"}
                    </span>
                  </div>
                ))}
              </div>
            </FormSection>
          ) : null}

          {active === "leads" ? (
            <TableSection
              title="Enrollment & Interest Leads"
              columns={["Type", "Name", "Email", "Phone", "Course", "Origin", "Referrer", "Support Needs", "Support Details", "Payment", "Created"]}
              rows={snapshot.leads.map((lead) => [
                lead.type,
                `${lead.first_name} ${lead.last_name}`,
                lead.email,
                lead.phone,
                courseBySlug.get(lead.course_slug)?.title ?? lead.course_slug,
                lead.origin.replace("_", " "),
                lead.referred_by ?? "—",
                lead.disability_status === "yes"
                  ? "Yes"
                  : lead.disability_status === "prefer_not_to_say"
                    ? "Prefer not to say"
                    : "No",
                lead.disability_details ?? "—",
                lead.payment_status ?? "—",
                new Date(lead.created_at).toLocaleDateString("en-AU"),
              ])}
            />
          ) : null}

          {active === "payments" ? (
            <TableSection
              title="Stripe Payments"
              columns={["Learner", "Course / Purpose", "Amount", "Status", "Provider status", "Date"]}
              rows={snapshot.payments.map((payment) => [
                payment.email ?? snapshot.students.find((student) => student.user_key === payment.user_key)?.email ?? "Learner",
                `${courseBySlug.get(payment.course_slug)?.title ?? payment.course_slug} · ${payment.purpose.replace("_", " ")}`,
                new Intl.NumberFormat("en-AU", { style: "currency", currency: payment.currency.toUpperCase() }).format(payment.amount_cents / 100),
                payment.status,
                payment.provider_status ?? "—",
                new Date(payment.paid_at ?? payment.created_at).toLocaleString("en-AU"),
              ])}
            />
          ) : null}

          {active === "assessments" ? (
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-black tracking-normal">Course Assessment Reviews</h1>
                <p className="mt-2 text-lg font-bold text-slate-500">
                  Review learner submissions, manage cluster access, and open assessor answer keys.
                </p>
              </div>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid gap-3 xl:grid-cols-[1.5fr_repeat(4,minmax(150px,1fr))]">
                  <label className="relative block">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      value={assessmentQuery}
                      onChange={(event) => setAssessmentQuery(event.target.value)}
                      placeholder="Search student, email, or phone..."
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold outline-none focus:border-[#1f7ac1] focus:bg-white"
                    />
                  </label>
                  <select
                    value={assessmentStatus}
                    onChange={(event) => setAssessmentStatus(event.target.value as AssessmentStatusFilter)}
                    className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700"
                  >
                    <option value="all">All statuses</option>
                    <option value="submitted">Submitted/reviewed</option>
                    <option value="satisfactory">Satisfactory</option>
                    <option value="not_satisfactory">Not satisfactory</option>
                    <option value="not_submitted">Not submitted</option>
                    <option value="locked">Locked</option>
                  </select>
                  <select
                    value={assessmentCluster}
                    onChange={(event) => setAssessmentCluster(event.target.value)}
                    className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700"
                  >
                    <option value="all">All clusters</option>
                    {Array.from({ length: 6 }).map((_, index) => (
                      <option key={index + 1} value={String(index + 1)}>
                        Cluster {index + 1}
                      </option>
                    ))}
                  </select>
                  <select
                    value={assessmentSource}
                    onChange={(event) => setAssessmentSource(event.target.value)}
                    className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700"
                  >
                    <option value="all">All sources</option>
                    {assessmentSources.map((source) => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                  <select
                    value={assessmentBatch}
                    onChange={(event) => setAssessmentBatch(event.target.value)}
                    className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700"
                  >
                    <option value="all">All batches</option>
                    {assessmentBatches.map((batch) => (
                      <option key={batch} value={String(batch)}>Batch {batch}</option>
                    ))}
                  </select>
                </div>
                <p className="mt-3 text-sm font-bold text-slate-500">
                  Showing {filteredCourseWorkflowStudents.reduce((sum, student) => sum + student.assignments.length, 0)} cluster rows across {filteredCourseWorkflowStudents.length} students.
                </p>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-black">Assessor answer keys</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {snapshot.courseWorkflow.adminResources.length ? snapshot.courseWorkflow.adminResources.map((resource) => (
                    <a
                      key={resource.id}
                      href={`/api/admin/assignment-file?type=resource&id=${resource.id}`}
                      target="_blank"
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-[#1f7ac1]"
                    >
                      <p className="text-xs font-black uppercase tracking-[0.1em] text-[#1f7ac1]">
                        Cluster {resource.assignment_key.replace("assignment-", "")}
                      </p>
                      <h3 className="mt-2 text-base font-black text-slate-900">{resource.title}</h3>
                      <p className="mt-2 text-sm font-bold text-slate-500">Admin-only assessor resource</p>
                    </a>
                  )) : (
                    <p className="text-sm font-bold text-slate-500">No assessor keys uploaded yet.</p>
                  )}
                </div>
              </section>

              <div className="space-y-5">
                {filteredCourseWorkflowStudents.length ? filteredCourseWorkflowStudents.map((student) => {
                  const name = student.displayName;
                  return (
                    <section key={student.userKey} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-6">
                        <div>
                          <h2 className="text-2xl font-black">{name}</h2>
                          <p className="mt-1 text-sm font-bold text-slate-500">
                            {student.email ?? "No email"} · {student.phone ?? "No phone"} · Source: {student.source ?? "Unknown"} · Batch {student.batchNumber ?? 2}
                          </p>
                        </div>
                        <span className="rounded-full bg-[#eef4fb] px-4 py-2 text-sm font-black text-[#1f7ac1]">
                          {student.assignments.filter((assignment) => assignment.unlocked).length}/{student.assignments.length} unlocked
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {student.assignments.map((assignment) => (
                          <div key={assignment.assignmentKey} className="grid gap-4 p-6 xl:grid-cols-[1fr_220px_1.1fr]">
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.1em] text-[#1f7ac1]">
                                Cluster {assignment.position}
                              </p>
                              <h3 className="mt-1 text-lg font-black text-slate-900">{assignment.subtitle}</h3>
                              <p className="mt-2 text-sm font-bold text-slate-500">{assignment.lockReason ?? "Access rule applied."}</p>
                            </div>

                            <div className="space-y-3">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                                assignment.status === "satisfactory"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : assignment.status === "not_satisfactory"
                                    ? "bg-rose-50 text-rose-700"
                                    : assignment.status === "locked"
                                      ? "bg-slate-100 text-slate-600"
                                      : "bg-amber-50 text-amber-700"
                              }`}>
                                {formatAssignmentStatus(assignment.status)}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleAssignmentAccess(student.userKey, assignment.assignmentKey, !assignment.unlocked)}
                                className="block h-10 rounded-xl border border-slate-200 px-4 text-sm font-black text-[#1f7ac1]"
                              >
                                {assignment.unlocked ? "Lock cluster" : "Unlock cluster"}
                              </button>
                            </div>

                            <div>
                              {assignment.submission ? (
                                <div className="space-y-3">
                                  <form action={handleAssignmentReview} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <input type="hidden" name="submissionId" value={assignment.submission.id} />
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                      <div className="flex flex-wrap gap-2">
                                        <a
                                          href={`/api/admin/assignment-file?type=submission&id=${assignment.submission.id}&mode=inline`}
                                          target="_blank"
                                          className="inline-flex h-9 items-center rounded-lg bg-[#1f7ac1] px-3 text-xs font-black text-white"
                                        >
                                          Open submission
                                        </a>
                                        <a
                                          href={`/api/admin/assignment-file?type=submission&id=${assignment.submission.id}&mode=download`}
                                          download
                                          className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-[#1f7ac1]"
                                        >
                                          Download submission
                                        </a>
                                      </div>
                                      <span className="text-xs font-bold text-slate-500">
                                        {new Date(assignment.submission.submitted_at).toLocaleString("en-AU")}
                                      </span>
                                    </div>
                                    <div className="mt-3 grid gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-600">
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span>Student file</span>
                                        <span className="text-slate-900">{assignment.submission.file_name}</span>
                                      </div>
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span>Submission cycle</span>
                                        <span className="text-slate-900">
                                          {assignment.submission.resubmission_count
                                            ? `Resubmission ${assignment.submission.resubmission_count}`
                                            : "First submission"}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span>Submitted by</span>
                                        <span className="text-slate-900">
                                          {assignment.submission.submitted_by === "admin"
                                            ? `Admin${assignment.submission.uploaded_by_admin_email ? ` (${assignment.submission.uploaded_by_admin_email})` : ""}`
                                            : "Student"}
                                        </span>
                                      </div>
                                      {assignment.submission.student_comment ? (
                                        <div>
                                          <span className="block text-slate-500">Student/admin upload note</span>
                                          <p className="mt-1 leading-6 text-slate-900">
                                            {assignment.submission.student_comment}
                                          </p>
                                        </div>
                                      ) : null}
                                    </div>
                                    <textarea
                                      name="adminComment"
                                      defaultValue={assignment.submission.admin_comment ?? ""}
                                      placeholder="Comments for the learner..."
                                      className="mt-3 min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold outline-none focus:border-[#1f7ac1]"
                                    />
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <button
                                        name="status"
                                        value="satisfactory"
                                        className="h-10 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white"
                                      >
                                        Satisfactory
                                      </button>
                                      <button
                                        name="status"
                                        value="not_satisfactory"
                                        className="h-10 rounded-xl bg-rose-600 px-4 text-sm font-black text-white"
                                      >
                                        Not satisfactory
                                      </button>
                                    </div>
                                  </form>
                                  {assignment.unlocked ? (
                                    <form action={handleAdminAssignmentUpload} className="rounded-xl border border-dashed border-slate-200 bg-white p-4">
                                      <input type="hidden" name="userKey" value={student.userKey} />
                                      <input type="hidden" name="assignmentKey" value={assignment.assignmentKey} />
                                      <label className="block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                        Replace with admin upload
                                        <input
                                          name="file"
                                          type="file"
                                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                          required
                                          className="mt-2 block w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm font-bold text-slate-700"
                                        />
                                      </label>
                                      <textarea
                                        name="studentComment"
                                        placeholder="Optional note shown to the learner..."
                                        className="mt-3 min-h-20 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-bold outline-none focus:border-[#1f7ac1]"
                                      />
                                      <button className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-[#111c2b] px-4 text-sm font-black text-white">
                                        <Upload size={14} /> Upload for student
                                      </button>
                                    </form>
                                  ) : null}
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500">
                                    No submission yet.
                                  </div>
                                  {assignment.unlocked ? (
                                    <form action={handleAdminAssignmentUpload} className="rounded-xl border border-dashed border-slate-200 bg-white p-4">
                                      <input type="hidden" name="userKey" value={student.userKey} />
                                      <input type="hidden" name="assignmentKey" value={assignment.assignmentKey} />
                                      <label className="block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                        Admin upload completed assessment
                                        <input
                                          name="file"
                                          type="file"
                                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                          required
                                          className="mt-2 block w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm font-bold text-slate-700"
                                        />
                                      </label>
                                      <textarea
                                        name="studentComment"
                                        placeholder="Optional note shown to the learner..."
                                        className="mt-3 min-h-20 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-bold outline-none focus:border-[#1f7ac1]"
                                      />
                                      <button className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-[#111c2b] px-4 text-sm font-black text-white">
                                        <Upload size={14} /> Upload for student
                                      </button>
                                    </form>
                                  ) : (
                                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs font-black text-slate-500">
                                      Unlock this cluster before uploading on behalf of the learner.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                }) : (
                  <section className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500">
                    No assessment rows match the selected filters.
                  </section>
                )}
              </div>
            </div>
          ) : null}

          {active === "excel" ? (
            <FormSection title="Excel Import / Export" description="Export clean templates or import populated .xlsx files.">
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {exportEntities.map((entity) => (
                  <div key={entity} className="rounded-xl border border-slate-200 p-5">
                    <h3 className="text-lg font-black capitalize">{entity}</h3>
                    <div className="mt-5 flex flex-col gap-3">
                      <a
                        href={`/api/admin/export?entity=${entity}`}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1f7ac1] px-4 text-sm font-black text-white"
                      >
                        <Download size={16} /> Export
                      </a>
                      <button
                        type="button"
                        onClick={() => handleImport(entity)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black text-[#1f7ac1]"
                      >
                        <Upload size={16} /> Import
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <input ref={fileRef} type="file" accept=".xlsx" className="mt-6 block w-full rounded-xl border border-slate-200 p-4 font-bold" />
            </FormSection>
          ) : null}

        </div>
      </section>
    </main>
  );
}

function StudentTableSection({
  students,
  view,
  activeCount,
  archivedCount,
  onViewChange,
  onAdd,
  onEdit,
  onArchive,
  onRestore,
}: {
  students: AdminStudent[];
  view: "active" | "archived";
  activeCount: number;
  archivedCount: number;
  onViewChange: (view: "active" | "archived") => void;
  onAdd: () => void;
  onEdit: (student: AdminStudent) => void;
  onArchive: (student: AdminStudent) => void;
  onRestore: (student: AdminStudent) => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
        <div>
          <h1 className="text-3xl font-black tracking-normal">Students</h1>
          <div className="mt-4 flex gap-2" role="tablist" aria-label="Student status">
            {([
              ["active", `Active ${activeCount}`],
              ["archived", `Archived ${archivedCount}`],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={view === value}
                onClick={() => onViewChange(value)}
                className={`rounded-lg px-3 py-2 text-xs font-black transition ${
                  view === value ? "bg-[#eaf4fd] text-[#126fb8]" : "bg-slate-50 text-slate-500 hover:text-slate-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onAdd} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1f7ac1] px-4 text-sm font-black text-white">
          <Plus size={18} /> Add Student
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left">
          <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
            <tr>
              {[
                "Name",
                "Email",
                "Phone",
                "Batch",
                "Origin / Referrer",
                view === "archived" ? "Archived" : "Created",
                "Actions",
              ].map((column) => <th key={column} className="px-6 py-4">{column}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.length ? students.map((student) => (
              <tr key={student.id} className="text-sm font-bold text-slate-700">
                <td className="px-6 py-4 font-black text-slate-900">{studentDisplayName(student)}</td>
                <td className="px-6 py-4">{student.email || "—"}</td>
                <td className="px-6 py-4">{student.phone || "—"}</td>
                <td className="px-6 py-4">Batch {student.batch_number ?? 2}</td>
                <td className="px-6 py-4"><span className="rounded-full bg-[#eef5fb] px-3 py-1 text-xs font-black capitalize text-[#1f7ac1]">{student.origin.replace("_", " ")}</span>{student.referred_by ? <span className="ml-2 text-xs font-bold text-slate-500">{student.referred_by}</span> : null}</td>
                <td className="px-6 py-4">
                  {new Date(view === "archived" ? student.archived_at! : student.created_at).toLocaleDateString("en-AU")}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {view === "active" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onEdit(student)}
                          title="Edit student"
                          aria-label={`Edit ${studentDisplayName(student)}`}
                          className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-[#1f7ac1] hover:bg-[#eef5fb]"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onArchive(student)}
                          title="Delete student"
                          aria-label={`Delete ${studentDisplayName(student)}`}
                          className="flex size-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onRestore(student)}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-200 px-3 text-xs font-black text-emerald-700 hover:bg-emerald-50"
                      >
                        <RotateCcw size={15} /> Restore
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td className="px-6 py-10 text-center text-sm font-bold text-slate-500" colSpan={7}>
                  No {view} students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TableSection({
  title,
  actionLabel,
  onAction,
  columns,
  rows,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  columns: string[];
  rows: string[][];
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-6">
        <h1 className="text-3xl font-black tracking-normal">{title}</h1>
        {actionLabel ? (
          <button onClick={onAction} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1f7ac1] px-4 text-sm font-black text-white">
            <Plus size={18} /> {actionLabel}
          </button>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
            <tr>{columns.map((column) => <th key={column} className="px-6 py-4">{column}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length ? rows.map((row, index) => (
              <tr key={index} className="text-sm font-bold text-slate-700">
                {row.map((cell, cellIndex) => (
                  <td key={`${index}-${cellIndex}`} className="max-w-[320px] truncate px-6 py-4">{cell}</td>
                ))}
              </tr>
            )) : (
              <tr>
                <td className="px-6 py-10 text-center text-sm font-bold text-slate-500" colSpan={columns.length}>
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FormSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
      <h1 className="text-3xl font-black tracking-normal">{title}</h1>
      <p className="mt-2 text-base font-bold text-slate-500">{description}</p>
      <div className="mt-7">{children}</div>
    </section>
  );
}

function TextField({
  name,
  label,
  type = "text",
  required,
  defaultValue,
  readOnly,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-black text-slate-700">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        readOnly={readOnly}
        className="h-12 rounded-xl border border-slate-200 px-4 font-bold outline-none focus:border-[#1f7ac1]"
      />
    </label>
  );
}

function TextArea({
  name,
  label,
  required,
  placeholder,
  defaultValue,
}: {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-black text-slate-700 md:col-span-2">
      {label}
      <textarea
        name={name}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        rows={4}
        className="rounded-xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-[#1f7ac1]"
      />
    </label>
  );
}

function SubmitButton({ label }: { label: string }) {
  return (
    <div className="md:col-span-2">
      <button className="inline-flex h-12 items-center rounded-xl bg-[#1f7ac1] px-6 text-sm font-black text-white">
        {label}
      </button>
    </div>
  );
}
