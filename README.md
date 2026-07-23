# Yoon Fatt Industries — Website

Business website + product catalog with an enquiry system for Yoon Fatt Industries
(M) Sdn. Bhd., manufacturer of SOFA agriculture sprayers. Browse products, view
details, and send enquiries via WhatsApp or email. **No online payment, no stock
tracking.**

## Tech stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **next-intl** — locales `en` (default), `ms`, `zh`, URL-prefixed (`/en`, `/ms`, `/zh`)
- **Supabase** — Postgres, Auth (admin only), Storage (product images)
- **Resend** — enquiry emails (optional)
- Deploy target: **Vercel**

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in values (all optional to preview)
npm run dev                  # http://localhost:3000  → redirects to /en
```

> **The site runs without Supabase.** When Supabase env vars are absent, all
> content is served from local seed data (`lib/seed/data.ts`), so you can preview
> the full UI immediately. Wire Supabase when you're ready (below).

## Wiring Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. **Run the schema**: open the SQL editor and run `supabase/migrations/0001_init.sql`
   (creates tables, RLS policies, and the `product-images` storage bucket).
3. Copy your keys from **Project Settings → API** into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server/scripts only — never exposed to the browser)
4. Set `ADMIN_EMAIL` / `ADMIN_PASSWORD` (used once to create the admin login).
5. **Seed content + admin user**:
   ```bash
   npm run seed
   ```
   Idempotent — safe to re-run (upserts on slug/key).

> ⚠️ **Note:** the public pages currently read from seed data even when Supabase is
> configured. Swapping the reads in `lib/data.ts` to query Supabase is the next
> planned step (see "Remaining work"). The enquiry **write** path already uses
> Supabase when configured.

## Enquiry emails (optional)

Set `RESEND_API_KEY` and `ENQUIRY_TO_EMAIL` in `.env.local`. Without them, email
enquiries still save to the `enquiries` table (when Supabase is configured) and the
user still sees a success state. WhatsApp enquiries open `wa.me` and are recorded.

## Adding a new language later

1. Add the locale to `i18n/routing.ts` (`locales`).
2. Add a message file `messages/<locale>.json`.
3. Add translation rows for that locale (via seed data or, later, the admin panel).
   No schema change needed — missing translations fall back to English.

## Deploying to Vercel

1. Push to GitHub, import the repo in Vercel.
2. Add the same environment variables in the Vercel project settings.
3. Deploy. (Free-tier Supabase pauses after ~7 days idle — a keep-alive cron is
   planned; see "Remaining work".)

## Project structure

```
app/[locale]/         Public pages (home, products, product detail, about, contact, enquiry, sofa-sprayer)
app/api/enquiry/      Enquiry submission (Supabase insert + Resend email)
components/            Layout, product, enquiry, contact components
i18n/                 next-intl routing / request / navigation
lib/                  types, data-access layer, seed data, formatting, whatsapp helpers
messages/             en / ms / zh UI strings
supabase/migrations/  SQL schema + RLS
scripts/seed.ts       Seed content + admin user
```

## Remaining work (not in this MVP)

- Swap `lib/data.ts` reads from seed data to live Supabase queries (+ ISR)
- Admin panel (`/admin`) — product/category/settings CRUD, enquiries list
- GSAP scroll experience on `/sofa-sprayer`
- Scraper/migration script for the ~60 existing products
- SEO polish (sitemap, hreflang, JSON-LD), image optimization, keep-alive cron
