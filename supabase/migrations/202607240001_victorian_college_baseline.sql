create extension if not exists pgcrypto;

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

create table public.courses (
  slug text primary key, code text not null, title text not null, category text not null,
  label text not null default 'Sample course', price_aud integer not null default 0,
  enrolment_fee integer, duration text not null default '', description text not null,
  overview text, image_url text, external_video_url text, delivery_modes text[] not null default '{}',
  entry_requirements text[] not null default '{}', career_outcomes text[] not null default '{}',
  unit_summary text not null default '', availability text not null default 'details-to-follow'
    check (availability in ('open','coming-soon','details-to-follow')),
  price_label text, status_note text, detail_variant text default 'standard',
  external_access_url text, external_access_label text, duration_details text, fee_details text,
  delivery_strategy text, source_archive_url text, requires_lln boolean not null default false,
  lln_test_key text, lln_pass_percent integer check (lln_pass_percent between 0 and 100),
  assessment_unlock_amount_cents integer not null default 0 check (assessment_unlock_amount_cents >= 0),
  is_active boolean not null default true, archived_at timestamptz, archived_by_email text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.course_lessons (
  id uuid primary key default gen_random_uuid(), course_slug text not null references public.courses on delete cascade,
  lesson_key text not null, title text not null, duration text, video_provider text not null default 'youtube'
    check (video_provider in ('youtube','google-drive')), video_url text not null default '',
  position integer not null default 0, is_preview boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(course_slug, lesson_key)
);

create table public.course_units (
  id uuid primary key default gen_random_uuid(), course_slug text not null references public.courses on delete cascade,
  code text not null, title text not null, type text not null default 'Core', prerequisite text,
  position integer not null default 0, created_at timestamptz not null default now(),
  unique(course_slug, code)
);

create table public.student_profiles (
  id uuid primary key default gen_random_uuid(), user_key text not null unique,
  first_name text, last_name text, email text, phone text, batch_number integer not null default 1,
  stripe_customer_id text, date_of_birth date, usi text, residential_address text,
  disability_status text check (disability_status is null or disability_status in ('no','yes','prefer_not_to_say')),
  disability_details text, origin text not null default 'self_enrolled'
    check (origin in ('admin','import','self_enrolled')), referred_by text,
  archived_at timestamptz, archived_by_email text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.enrollment_leads (
  id uuid primary key default gen_random_uuid(), first_name text not null, last_name text not null,
  email text not null, phone text not null, date_of_birth date, usi text, address text,
  disability_status text, disability_details text, course_slug text not null references public.courses,
  payment_status text not null default 'pending', stripe_session_id text unique,
  provider text, provider_payment_id text, provider_status text, provider_response jsonb,
  email_status text not null default 'pending', email_error text, email_sent_at timestamptz,
  origin text not null default 'self_enrolled', referred_by text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.interest_leads (
  id uuid primary key default gen_random_uuid(), first_name text not null, last_name text not null,
  email text not null, phone text not null, course_slug text not null references public.courses,
  message text, origin text not null default 'self_enrolled', referred_by text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.course_enrollments (
  id uuid primary key default gen_random_uuid(), user_key text not null references public.student_profiles(user_key) on delete cascade,
  course_slug text not null references public.courses on delete cascade, status text not null default 'active'
    check (status in ('active','refunded','revoked','archived')), stripe_customer_id text,
  stripe_session_id text unique, amount_paid integer, currency text, source text, source_note text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(user_key, course_slug)
);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(), user_key text not null references public.student_profiles(user_key) on delete cascade,
  course_slug text not null references public.courses on delete cascade, lesson_id text not null,
  progress_seconds integer not null default 0, completed boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(user_key, course_slug, lesson_id)
);

create table public.lln_attempts (
  id uuid primary key default gen_random_uuid(), user_key text not null references public.student_profiles(user_key) on delete cascade, email text,
  course_slug text not null references public.courses on delete cascade, test_key text not null,
  score integer not null, total integer not null, score_percent integer not null, passed boolean not null,
  answers jsonb not null default '{}', created_at timestamptz not null default now()
);

create table public.course_assignments (
  id uuid primary key default gen_random_uuid(), course_slug text not null references public.courses on delete cascade,
  assignment_key text not null, title text not null, subtitle text not null default '', overview text not null default '',
  position integer not null default 0, is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(course_slug, assignment_key)
);

create table public.course_assignment_resources (
  id uuid primary key default gen_random_uuid(), course_slug text not null, assignment_key text not null,
  resource_key text not null, audience text not null check (audience in ('student','admin')),
  kind text not null check (kind in ('slides','learning_resource','assessment','assessor_key')),
  title text not null, description text not null default '', original_bucket text not null default 'course-resources',
  original_path text, original_mime_type text, preview_bucket text not null default 'course-resources',
  preview_path text, preview_mime_type text, downloadable boolean not null default false,
  position integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(course_slug, assignment_key, resource_key), foreign key(course_slug, assignment_key) references public.course_assignments(course_slug, assignment_key) on delete cascade
);

create table public.student_assignment_access (
  id uuid primary key default gen_random_uuid(), user_key text not null references public.student_profiles(user_key) on delete cascade,
  course_slug text not null, assignment_key text not null, unlocked boolean not null default false,
  source text, reason text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(user_key, course_slug, assignment_key), foreign key(course_slug, assignment_key) references public.course_assignments(course_slug, assignment_key) on delete cascade
);

create table public.assignment_submissions (
  id uuid primary key default gen_random_uuid(), user_key text not null references public.student_profiles(user_key) on delete cascade,
  course_slug text not null, assignment_key text not null, file_bucket text not null default 'student-submissions',
  file_path text not null, file_name text not null, mime_type text, file_size bigint,
  status text not null default 'submitted' check (status in ('submitted','satisfactory','not_satisfactory')),
  student_comment text, resubmission_count integer not null default 0, submitted_by text not null default 'student',
  uploaded_by_admin_email text, admin_comment text, reviewed_by text, submitted_at timestamptz not null default now(),
  reviewed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(user_key, course_slug, assignment_key), foreign key(course_slug, assignment_key) references public.course_assignments(course_slug, assignment_key) on delete cascade
);

create table public.payment_intents (
  id uuid primary key default gen_random_uuid(), provider text not null, provider_payment_id text,
  purpose text not null check (purpose in ('course_enrollment','assignment_unlock')),
  status text not null default 'pending' check (status in ('pending','paid','failed','cancelled')),
  user_key text not null, email text, course_slug text not null references public.courses,
  enrollment_id uuid, assignment_keys text[], amount_cents integer not null, currency text not null default 'aud',
  provider_status text, provider_response jsonb, checkout_url text, paid_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.admin_notification_reads (
  admin_email text not null, event_key text not null, read_at timestamptz not null default now(),
  primary key(admin_email, event_key)
);

create index courses_active_title_idx on public.courses(is_active, title);
create index course_lessons_position_idx on public.course_lessons(course_slug, position);
create index enrollments_user_status_idx on public.course_enrollments(user_key, status);
create index progress_user_course_idx on public.lesson_progress(user_key, course_slug);
create index lln_attempts_user_course_idx on public.lln_attempts(user_key, course_slug, created_at desc);
create index submissions_course_status_idx on public.assignment_submissions(course_slug, status);
create index payments_user_course_idx on public.payment_intents(user_key, course_slug);

do $$ declare table_name text; begin
  foreach table_name in array array['courses','course_lessons','course_units','student_profiles','enrollment_leads','interest_leads','course_enrollments','lesson_progress','lln_attempts','course_assignments','course_assignment_resources','student_assignment_access','assignment_submissions','payment_intents','admin_notification_reads']
  loop execute format('alter table public.%I enable row level security', table_name); end loop;
end $$;

grant usage on schema public to anon, authenticated;
grant select on public.courses, public.course_units to anon, authenticated;
grant select on public.course_lessons to anon, authenticated;
grant select, insert, update on public.student_profiles, public.course_enrollments, public.lesson_progress, public.lln_attempts, public.assignment_submissions to authenticated;
grant select on public.course_assignments, public.course_assignment_resources, public.student_assignment_access, public.payment_intents to authenticated;

create policy "Public reads active courses" on public.courses for select using (is_active);
create policy "Public reads course units" on public.course_units for select using (exists (select 1 from public.courses c where c.slug = course_slug and c.is_active));
create policy "Public reads preview lessons" on public.course_lessons for select using (is_preview or exists (select 1 from public.course_enrollments e where e.course_slug = course_slug and e.user_key = auth.uid()::text and e.status = 'active'));
create policy "Students manage own profile" on public.student_profiles for all to authenticated using (user_key = auth.uid()::text) with check (user_key = auth.uid()::text);
create policy "Students read own enrolments" on public.course_enrollments for select to authenticated using (user_key = auth.uid()::text);
create policy "Students manage own progress" on public.lesson_progress for all to authenticated using (user_key = auth.uid()::text) with check (user_key = auth.uid()::text);
create policy "Students manage own LLN attempts" on public.lln_attempts for all to authenticated using (user_key = auth.uid()::text) with check (user_key = auth.uid()::text);
create policy "Students read enrolled assignments" on public.course_assignments for select to authenticated using (exists (select 1 from public.course_enrollments e where e.course_slug = course_slug and e.user_key = auth.uid()::text and e.status = 'active'));
create policy "Students read assignment resources" on public.course_assignment_resources for select to authenticated using (audience = 'student' and exists (select 1 from public.course_enrollments e where e.course_slug = course_slug and e.user_key = auth.uid()::text and e.status = 'active'));
create policy "Students read own assignment access" on public.student_assignment_access for select to authenticated using (user_key = auth.uid()::text);
create policy "Students manage own submissions" on public.assignment_submissions for all to authenticated using (user_key = auth.uid()::text) with check (user_key = auth.uid()::text);
create policy "Students read own payments" on public.payment_intents for select to authenticated using (user_key = auth.uid()::text);

insert into storage.buckets(id, name, public, file_size_limit) values
  ('course-resources','course-resources',false,1200000000),
  ('student-submissions','student-submissions',false,52428800)
on conflict(id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

create policy "Students upload own submissions" on storage.objects for insert to authenticated
with check (bucket_id = 'student-submissions' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Students read own submissions" on storage.objects for select to authenticated
using (bucket_id = 'student-submissions' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Students update own submissions" on storage.objects for update to authenticated
using (bucket_id = 'student-submissions' and owner_id = auth.uid()::text);

do $$ declare table_name text; begin
  foreach table_name in array array['courses','course_lessons','student_profiles','enrollment_leads','interest_leads','course_enrollments','lesson_progress','course_assignments','course_assignment_resources','student_assignment_access','assignment_submissions','payment_intents']
  loop execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name); end loop;
end $$;
