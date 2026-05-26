import { readFileSync, existsSync } from 'node:fs';
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
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const EXECUTE = process.argv.includes('--execute');

if (!SUPABASE_URL) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
  process.exit(1);
}
if (EXECUTE && !SERVICE_KEY) {
  console.error(
    '--execute requires SUPABASE_SERVICE_ROLE_KEY in .env.local (bypasses RLS for deletes/updates).',
  );
  process.exit(1);
}
const KEY = SERVICE_KEY ?? ANON_KEY;
if (!KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, KEY, { auth: { persistSession: false } });

// Categories whose primary classification disqualifies a listing
// unless the name or subtypes reference laser hair removal.
const REMOVE_CATEGORIES = new Set([
  'Waxing salon',
  'Nail salon',
  'Hair salon',
  'Barber shop',
  'Tanning salon',
  'Tattoo shop',
  'Day spa',
]);

// Keywords on subtypes that hint a REVIEW provider probably does offer laser.
const HINT_KEYWORDS = ['laser', 'skin', 'dermatology', 'dermatologist', 'cosmetic', 'aesthetic'];

type Provider = {
  id: string;
  google_place_id: string;
  name: string;
  slug: string;
  city: string | null;
  state_code: string | null;
  rating: number | null;
  category: string | null;
  subtypes: string[] | null;
  website: string | null;
  is_laser_specialist: boolean | null;
};

type Bucket = 'KEEP' | 'REMOVE' | 'REVIEW';

function classify(p: Provider): { bucket: Bucket; hint?: string } {
  const subtypes = p.subtypes ?? [];
  const nameLower = p.name.toLowerCase();
  const hasLaserSubtype = subtypes.includes('Laser hair removal service');
  const nameMentionsLaser = nameLower.includes('laser');

  if (hasLaserSubtype || nameMentionsLaser) {
    return { bucket: 'KEEP' };
  }

  const cat = p.category?.trim() ?? '';
  if (REMOVE_CATEGORIES.has(cat)) {
    return { bucket: 'REMOVE' };
  }

  // REVIEW — surface hint if any subtype contains a relevant keyword
  const hintMatches = subtypes
    .map((s) => s.toLowerCase())
    .filter((s) => HINT_KEYWORDS.some((kw) => s.includes(kw)));
  const hint = hintMatches.length > 0 ? hintMatches.slice(0, 2).join(', ') : undefined;
  return { bucket: 'REVIEW', hint };
}

async function fetchAllProviders(): Promise<Provider[]> {
  const all: Provider[] = [];
  const pageSize = 1000;
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from('providers')
      .select(
        'id, google_place_id, name, slug, city, state_code, rating, category, subtypes, website, is_laser_specialist',
      )
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const chunk = data ?? [];
    all.push(...(chunk as Provider[]));
    if (chunk.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

function fmt(p: Provider): string {
  const cat = p.category ?? '—';
  return `  ${p.name}  [${cat}]`;
}

function fmtReview(p: Provider, hint: string | undefined): string {
  const cat = p.category ?? '—';
  const site = p.website ? `  ${p.website}` : '';
  const hintStr = hint ? `  (hint: ${hint})` : '';
  return `  ${p.name}  [${cat}]${hintStr}${site}`;
}

async function deleteProviders(ids: string[]): Promise<void> {
  const batchSize = 200;
  for (let i = 0; i < ids.length; i += batchSize) {
    const chunk = ids.slice(i, i + batchSize);
    const { error } = await supabase.from('providers').delete().in('id', chunk);
    if (error) throw error;
    console.log(`  Deleted ${Math.min(i + batchSize, ids.length)}/${ids.length}`);
  }
}

async function recomputeAggregates(): Promise<{
  citiesUpdated: number;
  citiesDeleted: number;
  statesUpdated: number;
}> {
  const { data: remaining, error } = await supabase
    .from('providers')
    .select('city, state_code, rating');
  if (error) throw error;

  type CityAgg = { name: string; state_code: string; count: number; ratingSum: number; ratingN: number };
  const cityByKey = new Map<string, CityAgg>();
  const stateProviderCounts = new Map<string, number>();
  const stateCityNames = new Map<string, Set<string>>();

  for (const r of (remaining ?? []) as { city: string | null; state_code: string | null; rating: number | null }[]) {
    if (!r.city || !r.state_code) continue;
    const key = `${r.state_code}|${r.city.toLowerCase()}`;
    let agg = cityByKey.get(key);
    if (!agg) {
      agg = { name: r.city, state_code: r.state_code, count: 0, ratingSum: 0, ratingN: 0 };
      cityByKey.set(key, agg);
    }
    agg.count++;
    if (typeof r.rating === 'number') {
      agg.ratingSum += r.rating;
      agg.ratingN++;
    }

    stateProviderCounts.set(r.state_code, (stateProviderCounts.get(r.state_code) ?? 0) + 1);
    if (!stateCityNames.has(r.state_code)) stateCityNames.set(r.state_code, new Set());
    stateCityNames.get(r.state_code)!.add(r.city.toLowerCase());
  }

  // Existing city rows
  const { data: existingCities, error: citiesErr } = await supabase
    .from('cities')
    .select('id, name, state_code');
  if (citiesErr) throw citiesErr;

  const keptKeys = new Set(cityByKey.keys());
  const toDeleteCityIds: string[] = [];
  for (const c of (existingCities ?? []) as { id: string; name: string; state_code: string }[]) {
    const key = `${c.state_code}|${c.name.toLowerCase()}`;
    if (!keptKeys.has(key)) toDeleteCityIds.push(c.id);
  }

  let citiesDeleted = 0;
  if (toDeleteCityIds.length > 0) {
    const batchSize = 200;
    for (let i = 0; i < toDeleteCityIds.length; i += batchSize) {
      const chunk = toDeleteCityIds.slice(i, i + batchSize);
      const { error } = await supabase.from('cities').delete().in('id', chunk);
      if (error) throw error;
      citiesDeleted += chunk.length;
    }
  }

  let citiesUpdated = 0;
  for (const agg of cityByKey.values()) {
    const avg = agg.ratingN > 0 ? agg.ratingSum / agg.ratingN : null;
    const { error } = await supabase
      .from('cities')
      .update({ provider_count: agg.count, avg_rating: avg })
      .eq('state_code', agg.state_code)
      .eq('name', agg.name);
    if (error) throw error;
    citiesUpdated++;
  }

  let statesUpdated = 0;
  for (const [code, count] of stateProviderCounts.entries()) {
    const cityCount = stateCityNames.get(code)?.size ?? 0;
    const { error } = await supabase
      .from('states')
      .update({ provider_count: count, city_count: cityCount })
      .eq('code', code);
    if (error) throw error;
    statesUpdated++;
  }

  // States with 0 providers — zero them out
  const allStateCodesSeen = new Set(stateProviderCounts.keys());
  const { data: allStates, error: statesErr } = await supabase.from('states').select('code');
  if (statesErr) throw statesErr;
  for (const s of (allStates ?? []) as { code: string }[]) {
    if (!allStateCodesSeen.has(s.code)) {
      const { error } = await supabase
        .from('states')
        .update({ provider_count: 0, city_count: 0 })
        .eq('code', s.code);
      if (error) throw error;
      statesUpdated++;
    }
  }

  return { citiesUpdated, citiesDeleted, statesUpdated };
}

function sample<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return arr;
  const step = Math.floor(arr.length / n);
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(arr[i * step]);
  return out;
}

async function main() {
  console.log(EXECUTE ? 'Mode: EXECUTE (will delete and recompute)' : 'Mode: DRY RUN (no changes)');
  console.log('Fetching all providers…');
  const providers = await fetchAllProviders();
  console.log(`Total providers: ${providers.length}\n`);

  const keep: Provider[] = [];
  const remove: Provider[] = [];
  const review: { p: Provider; hint?: string }[] = [];

  for (const p of providers) {
    const { bucket, hint } = classify(p);
    if (bucket === 'KEEP') keep.push(p);
    else if (bucket === 'REMOVE') remove.push(p);
    else review.push({ p, hint });
  }

  console.log(`KEEP:   ${keep.length} providers (have laser in subtypes or name)`);
  console.log(`REMOVE: ${remove.length} providers (clearly unrelated categories)`);
  console.log(`REVIEW: ${review.length} providers (might offer laser, needs verification)`);
  console.log('');

  console.log('--- KEEP samples ---');
  for (const p of sample(keep, 10)) console.log(fmt(p));
  console.log('');

  console.log('--- REMOVE samples ---');
  for (const p of sample(remove, 10)) console.log(fmt(p));
  console.log('');

  console.log('--- REVIEW samples (name [category] (hint) website) ---');
  for (const { p, hint } of sample(review, 10)) console.log(fmtReview(p, hint));
  console.log('');

  // Extra breakdowns for REVIEW
  const reviewWithSite = review.filter((r) => !!r.p.website);
  const reviewWithHint = review.filter((r) => !!r.hint);
  console.log(`REVIEW with website:           ${reviewWithSite.length}`);
  console.log(`REVIEW with laser/skin hint:   ${reviewWithHint.length}`);
  console.log('');

  if (!EXECUTE) {
    console.log('Dry run complete. Re-run with --execute to apply deletes and recompute aggregates.');
    return;
  }

  if (remove.length === 0) {
    console.log('Nothing to delete.');
    return;
  }

  console.log(`Deleting ${remove.length} providers…`);
  await deleteProviders(remove.map((p) => p.id));

  console.log('Recomputing city and state aggregates…');
  const { citiesUpdated, citiesDeleted, statesUpdated } = await recomputeAggregates();

  console.log('');
  console.log('Done.');
  console.log(`  Providers deleted: ${remove.length}`);
  console.log(`  Cities updated:    ${citiesUpdated}`);
  console.log(`  Cities deleted:    ${citiesDeleted}`);
  console.log(`  States updated:    ${statesUpdated}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
