# Victorian College of Knowledge

Next.js 16 website, student portal, learning management system and administration workspace for Victorian College of Knowledge.

## Local development

1. Copy `.env.example` to `.env.local` and add the Supabase values.
2. Install dependencies with `npm install`.
3. Start the application with `npm run dev`.

The application uses the modern Supabase publishable key in the browser and a server-only secret key for trusted administration routes. Never expose `SUPABASE_SECRET_KEY` through a `NEXT_PUBLIC_` variable.

## Database

Apply `supabase/migrations/202607240001_victorian_college_baseline.sql`, then run `supabase/seed.sql`. The seed contains three clearly marked sample courses and no user records.

Every exposed table has row-level security enabled. Student data is scoped to the authenticated Supabase user ID, while administrative operations use the server-only client after checking `VCK_ADMIN_EMAILS`.

## Optional integrations

Stripe, SMTP, reCAPTCHA, Google OAuth and the chatbot provider stay disabled when their environment values are absent. Course fees and availability remain “to be confirmed” until verified information is supplied.

## Deployment

The production deployment targets the separate `victorian-college` Vercel project. Set `NEXT_PUBLIC_APP_URL` to the final production URL and include `/auth/callback` in the Supabase Auth redirect allowlist.
