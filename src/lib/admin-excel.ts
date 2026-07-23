import ExcelJS from "exceljs";
import {
  upsertAdminCourse,
  upsertAdminEnrollment,
  upsertAdminLead,
  upsertAdminLesson,
  upsertAdminStudent,
  replaceAdminCourseUnits,
  getAdminSnapshot,
} from "@/lib/admin-data";
import { type AdminSnapshot } from "@/lib/admin-data";

export type ExcelEntity = "courses" | "students" | "enrollments" | "leads";

type ImportResult = {
  entity: ExcelEntity;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
};

const entities = new Set(["courses", "students", "enrollments", "leads"]);

export function parseExcelEntity(value: string | null): ExcelEntity {
  if (!value || !entities.has(value)) {
    throw new Error("Invalid Excel entity.");
  }

  return value as ExcelEntity;
}

function addSheet<T extends Record<string, unknown>>(
  workbook: ExcelJS.Workbook,
  name: string,
  rows: T[],
) {
  const sheet = workbook.addWorksheet(name);
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()),
  );

  sheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: Math.min(Math.max(header.length + 8, 16), 42),
  }));
  rows.forEach((row) => sheet.addRow(row));
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).height = 26;
  sheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F6EB8" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle" };
  });
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: Math.max(1, headers.length) } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4F8FC" } }; });
    }
  });
  const validations: Record<string, string[]> = {
    Status: ["active", "refunded", "revoked", "archived"],
    Origin: ["admin", "import", "self_enrolled"],
    "Disability Status": ["no", "yes", "prefer_not_to_say"],
    Type: ["enrollment", "interest"],
    "Payment Status": ["pending", "paid", "failed", "cancelled"],
    "Email Status": ["pending", "sent", "failed"],
    Availability: ["open", "coming-soon", "details-to-follow"],
  };
  headers.forEach((header, index) => {
    const values = validations[header];
    if (!values) return;
    for (let row = 2; row <= Math.max(500, sheet.rowCount + 50); row += 1) {
      sheet.getCell(row, index + 1).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`"${values.join(",")}"`],
      };
    }
  });
}

function addInstructions(workbook: ExcelJS.Workbook, entity: ExcelEntity) {
  const sheet = workbook.addWorksheet("Instructions");
  sheet.columns = [{ width: 28 }, { width: 90 }];
  [
    ["VCK Excel workflow", `${entity[0].toUpperCase()}${entity.slice(1)} operational import/export`],
    ["Matching key", entity === "courses" ? "Course Slug" : entity === "students" ? "Email" : entity === "enrollments" ? "Email + Course Slug" : "Type + Email + Course Slug"],
    ["Import rule", "Do not rename sheet names or column headers. Blank optional cells are accepted."],
    ["Safety", "All rows are validated before writes begin. Missing rows are never deleted."],
    ["Internal data", "UUIDs, access keys, Stripe session IDs, storage IDs, and timestamps are intentionally excluded."],
  ].forEach((values) => sheet.addRow(values));
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F6EB8" } };
}

function joinList(value: unknown) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function splitList(value: unknown) {
  return String(value ?? "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function valueOf(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== "") return row[key];
  }
  return "";
}

export async function buildExportWorkbook(entity: ExcelEntity, snapshot: AdminSnapshot) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "VCK Admin Portal";
  workbook.created = new Date();
  addInstructions(workbook, entity);

  if (entity === "courses") {
    addSheet(
      workbook,
      "Courses",
      snapshot.courses.map((course) => ({
        "Course Slug": course.slug, Code: course.code, Title: course.title,
        Category: course.category, Label: course.label, "Price AUD": course.priceAud,
        "Enrolment Fee": course.enrolmentFee ?? "", Duration: course.duration,
        Description: course.description, Overview: course.overview, "Image URL": course.image,
        Availability: course.availability ?? "open", "Price Label": course.priceLabel ?? "",
        "Delivery Modes": joinList(course.deliveryModes), "Entry Requirements": joinList(course.entryRequirements),
        "Career Outcomes": joinList(course.careerOutcomes), "Unit Summary": course.unitSummary,
        Archived: course.isActive ? "No" : "Yes",
      })),
    );
    addSheet(
      workbook,
      "Lessons",
      snapshot.courses.flatMap((course) =>
        course.lessons.map((lesson, index) => ({
          "Course Slug": course.slug, "Lesson Key": lesson.id, Title: lesson.title,
          Duration: lesson.duration, "Video Provider": lesson.videoProvider, "Video URL": lesson.videoUrl,
          "Is Preview": lesson.isPreview, Position: index,
        })),
      ),
    );
    addSheet(
      workbook,
      "Units",
      snapshot.courses.flatMap((course) =>
        course.units.map((unit, index) => ({
          "Course Slug": course.slug, Code: unit.code, Title: unit.title, Type: unit.type,
          Prerequisite: unit.prerequisite ?? "", Position: index,
        })),
      ),
    );
  }

  if (entity === "students") {
    const studentsByKey = new Map(snapshot.students.map((student) => [student.user_key, student]));
    addSheet(workbook, "Students", snapshot.students.map((student) => ({
      "First Name": student.first_name ?? "", "Last Name": student.last_name ?? "", Email: student.email ?? "",
      Phone: student.phone ?? "", DOB: student.date_of_birth ?? "", USI: student.usi ?? "",
      "Residential Address": student.residential_address ?? "", "Disability Status": student.disability_status ?? "",
      "Support Details": student.disability_details ?? "", "Batch Number": student.batch_number,
      Origin: student.origin, "Referred By": student.referred_by ?? "", Archived: student.archived_at ? "Yes" : "No",
    })));
    addSheet(
      workbook,
      "StudentCourseAccess",
      snapshot.enrollments.map((enrollment) => ({
        Email: studentsByKey.get(enrollment.user_key)?.email ?? "", "Course Slug": enrollment.course_slug,
        Status: enrollment.status, "Amount Paid": enrollment.amount_paid ?? "", Currency: enrollment.currency ?? "",
      })),
    );
  }

  if (entity === "enrollments") {
    const studentsByKey = new Map(snapshot.students.map((student) => [student.user_key, student]));
    addSheet(workbook, "Enrollments", snapshot.enrollments.map((enrollment) => ({
      Email: studentsByKey.get(enrollment.user_key)?.email ?? "", "Course Slug": enrollment.course_slug,
      "Course Title": snapshot.courses.find((course) => course.slug === enrollment.course_slug)?.title ?? "",
      Status: enrollment.status, "Amount Paid": enrollment.amount_paid ?? "", Currency: enrollment.currency ?? "AUD",
      Source: studentsByKey.get(enrollment.user_key)?.origin ?? "", "Referred By": studentsByKey.get(enrollment.user_key)?.referred_by ?? "",
      "Payment Provider": snapshot.payments.find((payment) => payment.user_key === enrollment.user_key && payment.course_slug === enrollment.course_slug)?.status ? "stripe" : "",
      "Payment Status": snapshot.payments.find((payment) => payment.user_key === enrollment.user_key && payment.course_slug === enrollment.course_slug)?.status ?? "",
    })));
  }

  if (entity === "leads") {
    addSheet(workbook, "Leads", snapshot.leads.map((lead) => ({
      Type: lead.type, "First Name": lead.first_name, "Last Name": lead.last_name, Email: lead.email,
      Phone: lead.phone, "Course Slug": lead.course_slug, Origin: lead.origin, "Referred By": lead.referred_by ?? "",
      "Disability Status": lead.disability_status ?? "", "Support Details": lead.disability_details ?? "",
      "Payment Status": lead.payment_status ?? "", "Email Status": lead.email_status ?? "",
    })));
  }

  return workbook;
}

function rowsFromSheet(workbook: ExcelJS.Workbook, sheetName: string) {
  const sheet = workbook.getWorksheet(sheetName);

  if (!sheet || sheet.rowCount < 2) {
    return [];
  }

  const headers = (sheet.getRow(1).values as ExcelJS.CellValue[])
    .slice(1)
    .map((value) => String(value ?? "").trim());
  const rows: Record<string, unknown>[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const values = row.values as ExcelJS.CellValue[];
    const item: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      item[header] = values[index + 1] ?? "";
    });

    if (Object.values(item).some((value) => String(value ?? "").trim())) {
      rows.push(item);
    }
  });

  return rows;
}

export async function importWorkbook(entity: ExcelEntity, buffer: ArrayBuffer): Promise<ImportResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const current = await getAdminSnapshot();

  const result: ImportResult = {
    entity,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  if (entity === "courses") {
    const courseRows = rowsFromSheet(workbook, "Courses");
    const lessonRows = rowsFromSheet(workbook, "Lessons");
    const unitRows = rowsFromSheet(workbook, "Units");

    const seenSlugs = new Set<string>();
    const prepared = courseRows.map((row, index) => {
      const course = {
        slug: String(valueOf(row, "Course Slug", "slug")).trim(),
        code: String(valueOf(row, "Code", "code") || "VCK"),
        title: String(valueOf(row, "Title", "title")), category: String(valueOf(row, "Category", "category") || "Other"),
        label: String(valueOf(row, "Label", "label") || "Course"), priceAud: Number(valueOf(row, "Price AUD", "priceAud") || 0),
        enrolmentFee: valueOf(row, "Enrolment Fee", "enrolmentFee") ? Number(valueOf(row, "Enrolment Fee", "enrolmentFee")) : null,
        duration: String(valueOf(row, "Duration", "duration")), description: String(valueOf(row, "Description", "description")),
        overview: String(valueOf(row, "Overview", "overview") || valueOf(row, "Description", "description")),
        image: String(valueOf(row, "Image URL", "image")), availability: String(valueOf(row, "Availability", "availability") || "open"),
        detailVariant: "standard", deliveryModes: splitList(valueOf(row, "Delivery Modes", "deliveryModes")),
        entryRequirements: splitList(valueOf(row, "Entry Requirements", "entryRequirements")),
        careerOutcomes: splitList(valueOf(row, "Career Outcomes", "careerOutcomes")), unitSummary: String(valueOf(row, "Unit Summary", "unitSummary")),
        lessons: lessonRows
          .filter((lesson) => String(valueOf(lesson, "Course Slug", "courseSlug")) === String(valueOf(row, "Course Slug", "slug")))
          .map((lesson) => ({
            id: String(valueOf(lesson, "Lesson Key", "lessonKey")), title: String(valueOf(lesson, "Title", "title")), duration: String(valueOf(lesson, "Duration", "duration")),
            videoProvider:
              String(valueOf(lesson, "Video Provider", "videoProvider") || "youtube") === "google-drive"
                ? "google-drive"
                : "youtube",
            videoUrl: String(valueOf(lesson, "Video URL", "videoUrl")), isPreview: String(valueOf(lesson, "Is Preview", "isPreview")).toLowerCase() === "true",
          })),
        units: unitRows
          .filter((unit) => String(valueOf(unit, "Course Slug", "courseSlug")) === String(valueOf(row, "Course Slug", "slug")))
          .map((unit) => ({
            code: String(valueOf(unit, "Code", "code")), title: String(valueOf(unit, "Title", "title")),
            type: String(valueOf(unit, "Type", "type") || "Skill set"), prerequisite: String(valueOf(unit, "Prerequisite", "prerequisite")),
          }))
          .filter((unit) => unit.code && unit.title),
      };

      if (!course.slug || !course.title || !course.description) {
        result.errors.push(`Courses row ${index + 2}: slug, title, and description are required.`);
      }
      if (seenSlugs.has(course.slug)) result.errors.push(`Courses row ${index + 2}: duplicate course slug ${course.slug}.`);
      seenSlugs.add(course.slug);
      if (!Number.isFinite(course.priceAud) || course.priceAud < 0) result.errors.push(`Courses row ${index + 2}: Price AUD must be a positive number.`);
      if (!["open", "coming-soon", "details-to-follow"].includes(course.availability)) result.errors.push(`Courses row ${index + 2}: invalid availability.`);
      course.lessons.forEach((lesson) => {
        if (!lesson.id || !lesson.title || !lesson.videoUrl) result.errors.push(`Courses row ${index + 2}: each lesson needs a lesson key, title, and video URL.`);
      });

      return course;
    });

    if (result.errors.length) {
      return result;
    }

    for (const course of prepared) {
      await upsertAdminCourse(course);
      for (const lesson of course.lessons) {
        if (lesson.title && lesson.videoUrl) {
          await upsertAdminLesson({
            courseSlug: course.slug,
            lessonKey: lesson.id,
            title: lesson.title,
            duration: lesson.duration,
            videoProvider: lesson.videoProvider,
            videoUrl: lesson.videoUrl,
            isPreview: lesson.isPreview,
          });
        }
      }
      await replaceAdminCourseUnits(course.slug, course.units);
      if (current.courses.some((item) => item.slug === course.slug)) result.updated += 1;
      else result.created += 1;
    }

    return result;
  }

  if (entity === "students") {
    const studentRows = rowsFromSheet(workbook, "Students");
    const accessRows = rowsFromSheet(workbook, "StudentCourseAccess");
    const seenEmails = new Set<string>();
    const seenUsis = new Set<string>();
    const prepared = studentRows.map((row, index) => {
      const email = String(valueOf(row, "Email", "email")).trim().toLowerCase();
      const usi = String(valueOf(row, "USI", "usi")).trim().toUpperCase();

      if (!email.includes("@")) {
        result.errors.push(`Students row ${index + 2}: valid email is required.`);
      }
      if (!String(valueOf(row, "First Name", "first_name", "firstName")).trim()) result.errors.push(`Students row ${index + 2}: first name is required.`);
      if (seenEmails.has(email)) result.errors.push(`Students row ${index + 2}: duplicate email ${email}.`);
      seenEmails.add(email);
      if (usi && !/^[A-Z0-9]{10}$/.test(usi)) result.errors.push(`Students row ${index + 2}: USI must be 10 letters or numbers.`);
      if (usi && seenUsis.has(usi)) result.errors.push(`Students row ${index + 2}: duplicate USI ${usi}.`);
      if (usi) seenUsis.add(usi);
      const batchNumber = Number(valueOf(row, "Batch Number", "batch_number", "batchNumber") || 2);
      if (!Number.isInteger(batchNumber) || batchNumber < 1) result.errors.push(`Students row ${index + 2}: batch number must be a positive whole number.`);
      const disabilityStatus = String(valueOf(row, "Disability Status", "disability_status"));
      if (disabilityStatus && !["no", "yes", "prefer_not_to_say"].includes(disabilityStatus)) result.errors.push(`Students row ${index + 2}: invalid disability status.`);

      return {
        firstName: String(valueOf(row, "First Name", "first_name", "firstName")),
        lastName: String(valueOf(row, "Last Name", "last_name", "lastName")),
        email,
        phone: String(valueOf(row, "Phone", "phone")), dob: String(valueOf(row, "DOB", "date_of_birth")), usi,
        address: String(valueOf(row, "Residential Address", "residential_address")),
        disabilityStatus: disabilityStatus || null,
        disabilityDetails: String(valueOf(row, "Support Details", "disability_details")),
        batchNumber,
        origin: "import" as const, referredBy: String(valueOf(row, "Referred By", "referred_by")),
      };
    });
    const preparedAccess = accessRows.map((row, index) => {
      const courseSlug = String(valueOf(row, "Course Slug", "courseSlug", "course_slug")).trim();
      const email = String(valueOf(row, "Email", "email")).trim();

      if (!courseSlug) {
        result.errors.push(`StudentCourseAccess row ${index + 2}: course slug is required.`);
      }

      if (!email) {
        result.errors.push(`StudentCourseAccess row ${index + 2}: email is required.`);
      }
      const status = String(valueOf(row, "Status", "status") || "active");
      if (!["active", "refunded", "revoked", "archived"].includes(status)) result.errors.push(`StudentCourseAccess row ${index + 2}: invalid status.`);
      if (!current.courses.some((course) => course.slug === courseSlug)) result.errors.push(`StudentCourseAccess row ${index + 2}: unknown course slug ${courseSlug}.`);

      return {
        email,
        courseSlug,
        status,
        amountPaid: valueOf(row, "Amount Paid", "amountPaid", "amount_paid") ? Number(valueOf(row, "Amount Paid", "amountPaid", "amount_paid")) : null,
        currency: String(valueOf(row, "Currency", "currency") || "aud"),
      };
    });

    if (result.errors.length) {
      return result;
    }

    for (const student of prepared) {
      await upsertAdminStudent(student);
      if (current.students.some((item) => item.email?.toLowerCase() === student.email.toLowerCase())) result.updated += 1;
      else result.created += 1;
    }

    for (const access of preparedAccess) {
      await upsertAdminEnrollment(access);
      result.updated += 1;
    }

    return result;
  }

  if (entity === "enrollments") {
    const enrollmentRows = rowsFromSheet(workbook, "Enrollments");
    const prepared = enrollmentRows.map((row, index) => {
      const email = String(valueOf(row, "Email", "email")).trim().toLowerCase();
      const courseSlug = String(valueOf(row, "Course Slug", "course_slug", "courseSlug")).trim();
      const status = String(valueOf(row, "Status", "status") || "active");
      const amountPaidValue = valueOf(row, "Amount Paid", "amount_paid", "amountPaid");
      const amountPaid = amountPaidValue ? Number(amountPaidValue) : null;
      if (!courseSlug) {
        result.errors.push(`Enrollments row ${index + 2}: course slug is required.`);
      }
      if (!email.includes("@")) result.errors.push(`Enrollments row ${index + 2}: valid email is required.`);
      if (!current.courses.some((course) => course.slug === courseSlug)) result.errors.push(`Enrollments row ${index + 2}: unknown course slug ${courseSlug}.`);
      if (!["active", "refunded", "revoked", "archived"].includes(status)) result.errors.push(`Enrollments row ${index + 2}: invalid status.`);
      if (amountPaid !== null && (!Number.isFinite(amountPaid) || amountPaid < 0)) result.errors.push(`Enrollments row ${index + 2}: amount paid must be a positive number.`);

      return {
        email, courseSlug, status, amountPaid,
        currency: String(valueOf(row, "Currency", "currency") || "aud"),
      };
    });

    if (result.errors.length) {
      return result;
    }

    for (const enrollment of prepared) {
      await upsertAdminEnrollment(enrollment);
      const profile = current.students.find((student) => student.email?.toLowerCase() === enrollment.email.toLowerCase());
      if (profile && current.enrollments.some((item) => item.user_key === profile.user_key && item.course_slug === enrollment.courseSlug)) result.updated += 1;
      else result.created += 1;
    }

    return result;
  }

  if (entity === "leads") {
    const leadRows = rowsFromSheet(workbook, "Leads");
    const prepared = leadRows.map((row, index) => {
      const email = String(valueOf(row, "Email", "email")).trim();

      if (!email.includes("@")) {
        result.errors.push(`Leads row ${index + 2}: valid email is required.`);
      }
      const type = String(valueOf(row, "Type", "type") || "interest");
      const paymentStatus = String(valueOf(row, "Payment Status", "payment_status", "paymentStatus") || "pending");
      const emailStatus = String(valueOf(row, "Email Status", "email_status", "emailStatus") || "pending");
      const disabilityStatus = String(valueOf(row, "Disability Status", "disability_status", "disabilityStatus") || "no");
      if (!String(valueOf(row, "First Name", "first_name", "firstName")).trim()) result.errors.push(`Leads row ${index + 2}: first name is required.`);
      if (!String(valueOf(row, "Last Name", "last_name", "lastName")).trim()) result.errors.push(`Leads row ${index + 2}: last name is required.`);
      if (!String(valueOf(row, "Phone", "phone")).trim()) result.errors.push(`Leads row ${index + 2}: phone is required.`);
      if (!String(valueOf(row, "Course Slug", "course_slug", "courseSlug")).trim()) result.errors.push(`Leads row ${index + 2}: course slug is required.`);
      if (!["enrollment", "interest"].includes(type)) result.errors.push(`Leads row ${index + 2}: type must be enrollment or interest.`);
      if (!["pending", "paid", "failed", "cancelled"].includes(paymentStatus)) result.errors.push(`Leads row ${index + 2}: invalid payment status.`);
      if (!["pending", "sent", "failed"].includes(emailStatus)) result.errors.push(`Leads row ${index + 2}: invalid email status.`);
      if (!["no", "yes", "prefer_not_to_say"].includes(disabilityStatus)) result.errors.push(`Leads row ${index + 2}: invalid disability status.`);

      return {
        type,
        firstName: String(valueOf(row, "First Name", "first_name", "firstName")),
        lastName: String(valueOf(row, "Last Name", "last_name", "lastName")),
        email,
        phone: String(valueOf(row, "Phone", "phone")), courseSlug: String(valueOf(row, "Course Slug", "course_slug", "courseSlug")),
        disabilityStatus,
        disabilityDetails: String(valueOf(row, "Support Details", "disability_details", "disabilityDetails")),
        paymentStatus,
        emailStatus,
        origin: "import" as const, referredBy: String(valueOf(row, "Referred By", "referred_by")),
      };
    });

    if (result.errors.length) {
      return result;
    }

    for (const lead of prepared) {
      await upsertAdminLead(lead);
      if (current.leads.some((item) => item.type === lead.type && item.email.toLowerCase() === lead.email.toLowerCase() && item.course_slug === lead.courseSlug)) result.updated += 1;
      else result.created += 1;
    }

    return result;
  }

  return result;
}
