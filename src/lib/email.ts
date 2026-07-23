import nodemailer from "nodemailer";
import { getCourse } from "@/lib/courses";
import type { EnrollmentLead } from "@/lib/enrollment";
import type { InterestLead } from "@/lib/interests";

type StudentFeedbackEmail = {
  userName: string;
  userEmail: string;
  subject: string;
  category: string;
  message: string;
};

export function isSmtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      process.env.SMTP_FROM &&
      process.env.ENROLLMENT_TO_EMAIL,
  );
}

function getTransporter() {
  if (!isSmtpConfigured()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE !== "false",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendEnrollmentEmail(lead: EnrollmentLead) {
  const transporter = getTransporter();

  if (!transporter) {
    throw new Error("SMTP is not configured yet.");
  }

  const course = getCourse(lead.course_slug);
  const fullName = `${lead.first_name} ${lead.last_name}`;
  const rows = [
    ["Student", fullName],
    ["Email", lead.email],
    ["Phone", lead.phone],
    ["Date of birth", lead.date_of_birth],
    ["USI", lead.usi],
    ["Address", lead.address],
    ["Course", course?.title ?? lead.course_slug],
    ["Payment status", lead.payment_status],
    ["Enrollment ID", lead.id],
  ];

  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;font-weight:700;border-bottom:1px solid #e5e7eb;">${escapeHtml(label)}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: process.env.ENROLLMENT_TO_EMAIL,
    replyTo: lead.email,
    subject: `New VCK enrollment: ${fullName}`,
    text,
    html: `
      <div style="font-family:Arial,sans-serif;color:#020d24;">
        <h1 style="margin:0 0 16px;">New VCK enrollment</h1>
        <table style="border-collapse:collapse;width:100%;max-width:680px;">${htmlRows}</table>
      </div>
    `,
  });
}

export async function sendInterestEmail(lead: InterestLead) {
  const transporter = getTransporter();

  if (!transporter) {
    // Graceful fallback for local testing if SMTP is not configured
    console.log("SMTP not configured. Interest Lead email not sent:", lead);
    return;
  }

  const course = getCourse(lead.course_slug);
  const fullName = `${lead.first_name} ${lead.last_name}`;
  const rows = [
    ["Student", fullName],
    ["Email", lead.email],
    ["Phone", lead.phone],
    ["Course of Interest", course?.title ?? lead.course_slug],
    ["Lead ID", lead.id],
    ["Type", lead.isMock ? "Mock Lead (Local Dev)" : "Official Lead"],
  ];

  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;font-weight:700;border-bottom:1px solid #e5e7eb;">${escapeHtml(label)}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: process.env.ENROLLMENT_TO_EMAIL,
    replyTo: lead.email,
    subject: `New VCK Course Interest Inquiry: ${fullName}`,
    text,
    html: `
      <div style="font-family:Arial,sans-serif;color:#020d24;">
        <h1 style="margin:0 0 16px;">New Course Interest Inquiry</h1>
        <p style="margin:0 0 16px;font-size:16px;">A user has submitted an interest enquiry from the homepage popup:</p>
        <table style="border-collapse:collapse;width:100%;max-width:680px;">${htmlRows}</table>
      </div>
    `,
  });
}

export async function sendStudentFeedbackEmail(feedback: StudentFeedbackEmail) {
  const transporter = getTransporter();

  if (!transporter || !process.env.ENROLLMENT_TO_EMAIL || !process.env.SMTP_FROM) {
    throw new Error("SMTP is not configured yet.");
  }

  const rows = [
    ["Student", feedback.userName],
    ["Email", feedback.userEmail],
    ["Category", feedback.category],
    ["Subject", feedback.subject],
  ];

  const text = `${rows.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\nMessage:\n${feedback.message}`;
  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;font-weight:700;border-bottom:1px solid #e5e7eb;">${escapeHtml(label)}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: process.env.ENROLLMENT_TO_EMAIL,
    replyTo: feedback.userEmail,
    subject: `Student Portal Feedback: ${feedback.subject}`,
    text,
    html: `
      <div style="font-family:Arial,sans-serif;color:#020d24;">
        <h1 style="margin:0 0 16px;">Student portal feedback</h1>
        <table style="border-collapse:collapse;width:100%;max-width:680px;">${htmlRows}</table>
        <div style="margin-top:16px;padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#f8fafc;">
          <p style="margin:0;font-weight:700;">Message</p>
          <p style="margin:10px 0 0;white-space:pre-wrap;line-height:1.6;">${escapeHtml(feedback.message)}</p>
        </div>
      </div>
    `,
  });
}
