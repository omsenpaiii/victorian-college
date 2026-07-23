import { getSupabaseAdmin, isSupabaseAuthConfigured } from "@/lib/supabase";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getAdminEmails, getInitials, isAdminEmail, manualStudentKey, normalizeEmail } from "@/lib/auth-shared";

export type AppUser = {
  id: string;
  email: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  initials: string;
};

type AuthUser = {
  id: string;
  email?: string | null;
  phone?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

function deriveNames(user: AuthUser) {
  const metadata = user.user_metadata ?? {};
  const fullName =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
        ? metadata.name
        : null;
  const firstName =
    typeof metadata.first_name === "string"
      ? metadata.first_name
      : fullName?.split(/\s+/).filter(Boolean)[0] ?? null;
  const lastName =
    typeof metadata.last_name === "string"
      ? metadata.last_name
      : fullName
        ? fullName
            .split(/\s+/)
            .filter(Boolean)
            .slice(1)
            .join(" ") || null
        : null;

  return { firstName, lastName, fullName };
}

export async function getCurrentUser(): Promise<AppUser | null> {
  if (!isSupabaseAuthConfigured()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const { firstName, lastName, fullName } = deriveNames(user);
  const email = normalizeEmail(user.email);
  const name = fullName ?? ([firstName, lastName].filter(Boolean).join(" ") || email.split("@")[0]);
  const phone = typeof user.phone === "string" && user.phone.trim() ? user.phone : null;
  const avatarUrl =
    typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;

  return {
    id: user.id,
    email,
    name,
    firstName,
    lastName,
    phone,
    avatarUrl,
    initials: getInitials(name, email),
  };
}

export async function syncStudentProfileFromUser(user: AuthUser | null | undefined) {
  const supabase = getSupabaseAdmin();

  if (!supabase || !user?.email) {
    return;
  }

  const email = normalizeEmail(user.email);
  const userKey = user.id;
  const manualKey = manualStudentKey(email);
  const { firstName, lastName } = deriveNames(user);
  const phone = typeof user.phone === "string" && user.phone.trim() ? user.phone : null;
  const now = new Date().toISOString();

  const [{ data: realProfile }, { data: manualProfile }] = await Promise.all([
    supabase
      .from("student_profiles")
      .select("id,user_key,first_name,last_name,phone,email,origin")
      .eq("user_key", userKey)
      .maybeSingle(),
    supabase
      .from("student_profiles")
      .select("id,user_key,first_name,last_name,phone,email,origin")
      .eq("user_key", manualKey)
      .maybeSingle(),
  ]);

  const mergedFirstName = realProfile?.first_name ?? manualProfile?.first_name ?? firstName ?? null;
  const mergedLastName = realProfile?.last_name ?? manualProfile?.last_name ?? lastName ?? null;
  const mergedPhone = realProfile?.phone ?? manualProfile?.phone ?? phone ?? null;

  if (manualProfile && manualProfile.user_key !== userKey) {
    if (realProfile) {
      await supabase
        .from("course_enrollments")
        .update({ user_key: userKey, updated_at: now })
        .eq("user_key", manualKey);
      await supabase
        .from("lesson_progress")
        .update({ user_key: userKey, updated_at: now })
        .eq("user_key", manualKey);
      await supabase
        .from("student_assignment_access")
        .update({ user_key: userKey, updated_at: now })
        .eq("user_key", manualKey);
      await supabase
        .from("assignment_submissions")
        .update({ user_key: userKey, updated_at: now })
        .eq("user_key", manualKey);
      await supabase.from("student_profiles").delete().eq("id", manualProfile.id);
    } else {
      await supabase
        .from("student_profiles")
        .update({
          user_key: userKey,
          email,
          first_name: mergedFirstName,
          last_name: mergedLastName,
          phone: mergedPhone,
          updated_at: now,
        })
        .eq("id", manualProfile.id);
      await supabase
        .from("course_enrollments")
        .update({ user_key: userKey, updated_at: now })
        .eq("user_key", manualKey);
      await supabase
        .from("lesson_progress")
        .update({ user_key: userKey, updated_at: now })
        .eq("user_key", manualKey);
      await supabase
        .from("student_assignment_access")
        .update({ user_key: userKey, updated_at: now })
        .eq("user_key", manualKey);
      await supabase
        .from("assignment_submissions")
        .update({ user_key: userKey, updated_at: now })
        .eq("user_key", manualKey);
    }
  }

  await supabase.from("student_profiles").upsert(
    {
      user_key: userKey,
      email,
      first_name: mergedFirstName,
      last_name: mergedLastName,
      phone: mergedPhone,
      origin: realProfile?.origin ?? manualProfile?.origin ?? "self_enrolled",
      updated_at: now,
    },
    { onConflict: "user_key" },
  );
}

export { getAdminEmails, getInitials, isAdminEmail, manualStudentKey, normalizeEmail };
