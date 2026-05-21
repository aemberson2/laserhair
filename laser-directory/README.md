# Laser Directory

A Next.js + Supabase directory site for laser hair removal providers across the US. Data is sourced from an Outscraper export, normalized into providers / cities / states tables, and rendered as pre-built static pages with hourly revalidation.

## Stack

- Next.js 16 (App Router, server components)
- Tailwind CSS
- Supabase (Postgres + PostgREST)
- TypeScript

## Routes

```
/                             Home (top states, top cities, FAQ)
/[stateSlug]                  State (cities + top-rated providers)
/[stateSlug]/[citySlug]       City (filtered provider list, FAQ)
/[stateSlug]/[citySlug]/[providerSlug]   Provider detail
/sitemap.xml                  Sitemap of all routes
/robots.txt
```

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run `supabase/migrations/001_schema.sql` (it lives in the repo root, one level up from this directory). This creates `providers`, `cities`, and `states` tables, indexes, and public-read RLS policies.
3. From **Project Settings → API**, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (required for imports; bypasses RLS)
4. Create a `.env.local` in this directory:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   ```

   `NEXT_PUBLIC_SITE_URL` is the production origin used for absolute URLs in the sitemap, OG tags, and JSON-LD. In dev it falls back to `http://localhost:3000`.

## 2. Import data from the Outscraper export

1. Place your Outscraper XLSX export at `data/outscraper-export.xlsx` (relative to this directory).
2. Run:

   ```bash
   npm install
   npm run import-data
   ```

The script (`scripts/import-data.ts`) reads the XLSX, filters out non-operational rows, dedupes by `google_place_id` (keeping the row with more reviews), generates unique slugs, and upserts into `providers`. It then aggregates the imported providers into `cities` and `states`. Re-running is idempotent.

Expected output:

```
Import summary
  Providers imported: 1234
  Cities created:     307
  States created:     33
```

## 3. Run the dev server

```bash
npm run dev
```

Then visit [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run lint       # ESLint
npm run build      # production build
npm run start      # serve the production build
```

## 4. Deploy to Vercel

1. Push this directory (or the full repo) to a GitHub repository.
2. Import the repo at [vercel.com/new](https://vercel.com/new). Vercel auto-detects Next.js.
3. Set the **Root Directory** to `laser-directory` if you're deploying from the repo root.
4. Under **Environment Variables**, add the same values from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (e.g. `https://your-domain.com`, no trailing slash)
   - `SUPABASE_SERVICE_ROLE_KEY` is **not** needed at runtime — only when running the import script locally. Leave it out of Vercel.
5. Deploy. Vercel will build the site and pre-render every state, city, and provider page via `generateStaticParams`.

Pages use ISR with `revalidate = 3600`, so changes in Supabase (e.g. running the import script again) propagate to the live site within an hour without redeploying.

### Custom domain

Add your domain in Vercel **Settings → Domains**, then update `NEXT_PUBLIC_SITE_URL` to match and redeploy. The sitemap, OG tags, and JSON-LD will pick up the new origin.

## Notes

- Provider photos are served via plain `<img>` tags (not `next/image`) because they come from arbitrary Google-hosted domains that would require listing every host in `next.config.ts`'s `remotePatterns`.
- The `cities.slug` includes the state code suffix (e.g. `springfield-il`, `springfield-ma`) to disambiguate identically named cities across states.
- The `Open now` badge on provider pages parses `working_hours` strings and uses the provider's timezone via `Intl.DateTimeFormat`. Unparseable formats are silently skipped (no badge) rather than guessed.
