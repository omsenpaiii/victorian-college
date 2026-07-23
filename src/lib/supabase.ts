import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
  isSupabaseAuthConfigured,
} from "@/lib/supabase-config";

let adminClient: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(isSupabaseAuthConfigured() && process.env["SUPABASE_SECRET_KEY"]);
}

export function getSupabaseAdmin() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!adminClient) {
    adminClient = createClient(getSupabaseUrl(), process.env["SUPABASE_SECRET_KEY"]!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return adminClient;
}

export { getSupabasePublishableKey, getSupabaseUrl, isSupabaseAuthConfigured };
