import { getCurrentUser } from "@/lib/auth";
import { getAdminEmails, isAdminEmail, manualStudentKey } from "@/lib/auth-shared";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  initials: string;
};

function getInitials(name: string, email: string) {
  const source = name.trim() || email.split("@")[0] || "Admin";
  const parts = source.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : source.slice(0, 2)).toUpperCase();
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const email = user.email.toLowerCase();
  const allowedEmails = getAdminEmails();

  if (!isAdminEmail(email, allowedEmails)) {
    return null;
  }

  const name = user.name || "VCK Admin";

  return {
    id: user.id,
    name,
    email,
    initials: getInitials(name, email),
  };
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    throw new Error("Unauthorized admin request.");
  }

  return admin;
}

export { manualStudentKey };
