"use client";

import { createBrowserClient } from "@supabase/ssr";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
  isSupabaseAuthConfigured,
} from "@/lib/supabase-config";

export function createBrowserSupabaseClient() {
  if (!isSupabaseAuthConfigured()) {
    throw new Error("Supabase Auth is not configured.");
  }

  return createBrowserClient(getSupabaseUrl(), getSupabasePublishableKey());
}
