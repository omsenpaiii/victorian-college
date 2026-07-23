import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

for (const envFile of [".env.local", ".env"]) {
  if (!existsSync(envFile)) {
    continue;
  }

  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    const value = rawValue.replace(/^['"]|['"]$/g, "");
    process.env[key] ??= value;
  }
}

const requiredEnv = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const missing = requiredEnv.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

async function assertNoError(label, promise) {
  const result = await promise;

  if (result.error) {
    console.error(`FAILED: ${label}`);
    console.error(result.error.message);
    process.exit(1);
  }

  console.log(`OK: ${label}`);
  return result;
}

const courseColumns = [
  "slug",
  "code",
  "title",
  "category",
  "label",
  "price_aud",
  "enrolment_fee",
  "duration",
  "description",
  "overview",
  "image_url",
  "external_video_url",
  "delivery_modes",
  "entry_requirements",
  "career_outcomes",
  "unit_summary",
  "availability",
  "price_label",
  "status_note",
  "detail_variant",
  "external_access_url",
  "external_access_label",
  "duration_details",
  "fee_details",
  "delivery_strategy",
  "source_archive_url",
  "is_active",
].join(",");

await assertNoError(
  "courses expanded admin columns are queryable",
  supabase.from("courses").select(courseColumns).limit(1),
);

await assertNoError(
  "student profile admin columns are queryable",
  supabase
    .from("student_profiles")
    .select("id,user_key,first_name,last_name,email,phone,stripe_customer_id,created_at,updated_at")
    .limit(1),
);

await assertNoError(
  "course_units table is queryable",
  supabase
    .from("course_units")
    .select("id,course_slug,code,title,type,prerequisite,position,created_at,updated_at")
    .limit(1),
);

await assertNoError(
  "course_lessons admin fields are queryable",
  supabase
    .from("course_lessons")
    .select("id,course_slug,lesson_key,title,duration,video_provider,video_url,position,is_preview")
    .limit(1),
);

const { count: activeCourseCount } = await assertNoError(
  "active course count can be read",
  supabase
    .from("courses")
    .select("slug", { count: "exact", head: true })
    .eq("is_active", true),
);

console.log(`OK: active courses = ${activeCourseCount ?? 0}`);
console.log("Supabase admin portal schema verification passed.");
