export function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

export function getInitials(name: string, email: string) {
  const source = name.trim() || email.split("@")[0] || "VCK";
  const parts = source.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : source.slice(0, 2)).toUpperCase();
}

export function manualStudentKey(email: string) {
  return `manual:${normalizeEmail(email)}`;
}

export function getAdminEmails() {
  return (process.env["VCK_ADMIN_EMAILS"] ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined, allowedEmails = getAdminEmails()) {
  const normalized = normalizeEmail(email);
  return Boolean(normalized && allowedEmails.includes(normalized));
}
