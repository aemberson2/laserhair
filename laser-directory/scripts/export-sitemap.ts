import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

function loadEnvLocal() {
  const path = resolve(process.cwd(), '.env.local');
  if (!existsSync(path)) return;
  for (const rawLine of readFileSync(path, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const site = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim().replace(/\/+$/, '');

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}
if (!site) {
  console.error('Missing NEXT_PUBLIC_SITE_URL in .env.local (e.g. https://your-domain.com)');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const outArg = process.argv[2];
const outPath = outArg ? resolve(process.cwd(), outArg) : resolve(process.cwd(), 'sitemap.xml');

async function main() {
  const [statesRes, citiesRes, providersRes] = await Promise.all([
    supabase.from('states').select('slug'),
    supabase.from('cities').select('slug, state_code'),
    supabase.from('providers').select('slug, city, state_code'),
  ]);
  if (statesRes.error) throw statesRes.error;
  if (citiesRes.error) throw citiesRes.error;
  if (providersRes.error) throw providersRes.error;

  const stateSlugByCode = new Map<string, string>();
  for (const s of statesRes.data ?? []) stateSlugByCode.set(s.slug.toUpperCase(), s.slug);
  // Build the same code->slug map the app uses
  const stateCodeToSlug = new Map<string, string>();
  {
    const { data, error } = await supabase.from('states').select('code, slug');
    if (error) throw error;
    for (const s of data ?? []) stateCodeToSlug.set(s.code, s.slug);
  }

  const today = new Date().toISOString().slice(0, 10);

  type Entry = { loc: string; priority: number; changefreq: string };
  const entries: Entry[] = [
    { loc: `${site}/`, priority: 1.0, changefreq: 'weekly' },
  ];

  for (const s of statesRes.data ?? []) {
    entries.push({ loc: `${site}/${s.slug}`, priority: 0.8, changefreq: 'weekly' });
  }

  const citySlugByKey = new Map<string, string>();
  for (const c of citiesRes.data ?? []) {
    const stateSlug = stateCodeToSlug.get(c.state_code);
    if (!stateSlug) continue;
    entries.push({
      loc: `${site}/${stateSlug}/${c.slug}`,
      priority: 0.9,
      changefreq: 'weekly',
    });
    citySlugByKey.set(`${c.state_code}|${c.slug}`, c.slug);
  }

  // For providers, join provider.city (name) -> cities.slug via (state_code, name)
  const cityNameToSlug = new Map<string, string>();
  {
    const { data, error } = await supabase.from('cities').select('name, slug, state_code');
    if (error) throw error;
    for (const c of data ?? []) {
      cityNameToSlug.set(`${c.state_code}|${c.name.toLowerCase()}`, c.slug);
    }
  }

  for (const p of providersRes.data ?? []) {
    if (!p.state_code || !p.city) continue;
    const stateSlug = stateCodeToSlug.get(p.state_code);
    const citySlug = cityNameToSlug.get(`${p.state_code}|${p.city.toLowerCase()}`);
    if (!stateSlug || !citySlug) continue;
    entries.push({
      loc: `${site}/${stateSlug}/${citySlug}/${p.slug}`,
      priority: 0.7,
      changefreq: 'monthly',
    });
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((e) =>
      [
        '  <url>',
        `    <loc>${escapeXml(e.loc)}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        `    <changefreq>${e.changefreq}</changefreq>`,
        `    <priority>${e.priority.toFixed(1)}</priority>`,
        '  </url>',
      ].join('\n'),
    ),
    '</urlset>',
    '',
  ].join('\n');

  writeFileSync(outPath, xml);
  const states = (statesRes.data ?? []).length;
  const cities = (citiesRes.data ?? []).length;
  const providers = entries.length - 1 - states - cities;
  console.log(`Wrote ${entries.length} URLs to ${outPath}`);
  console.log(`  states:    ${states}`);
  console.log(`  cities:    ${cities}`);
  console.log(`  providers: ${providers}`);
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
