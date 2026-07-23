export function getSupabaseUrl() {
  return process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? process.env["SUPABASE_URL"] ?? "";
}

export function getSupabasePublishableKey() {
  return process.env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"] ?? "";
}

export function isSupabaseAuthConfigured() {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}
