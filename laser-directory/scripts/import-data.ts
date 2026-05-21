import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

// Load .env.local manually (tsx doesn't auto-load it).
function loadEnvLocal() {
  const path = resolve(process.cwd(), '.env.local');
  if (!existsSync(path)) return;
  const text = readFileSync(path, 'utf8');
  for (const rawLine of text.split('\n')) {
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

if (!SUPABASE_URL) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
  process.exit(1);
}
const KEY = SERVICE_KEY ?? ANON_KEY;
if (!KEY) {
  console.error(
    'Missing SUPABASE_SERVICE_ROLE_KEY (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
  );
  process.exit(1);
}
if (!SERVICE_KEY) {
  console.warn(
    'Warning: using anon key. With RLS enabled, inserts will be rejected. Set SUPABASE_SERVICE_ROLE_KEY for imports.',
  );
}

const supabase = createClient(SUPABASE_URL, KEY, {
  auth: { persistSession: false },
});

const XLSX_PATH = resolve(process.cwd(), 'data/outscraper-export.xlsx');

// Column indices in the Outscraper export
const COL = {
  name: 1,
  subtypes: 3,
  category: 4,
  phone: 6,
  website: 7,
  address: 8,
  street: 9,
  city: 10,
  county: 11,
  state: 12,
  state_code: 13,
  postal_code: 14,
  latitude: 17,
  longitude: 18,
  timezone: 20,
  rating: 23,
  review_count: 24,
  reviews_1: 28,
  reviews_2: 29,
  reviews_3: 30,
  reviews_4: 31,
  reviews_5: 32,
  photo_count: 33,
  photo_url: 34,
  logo_url: 36,
  business_status: 39,
  working_hours: 40,
  booking_url: 48,
  about: 51,
  is_verified: 54,
  google_maps_url: 58,
  google_place_id: 60,
} as const;

type Provider = {
  google_place_id: string;
  name: string;
  slug: string;
  phone: string | null;
  website: string | null;
  address: string | null;
  street: string | null;
  city: string | null;
  county: string | null;
  state: string | null;
  state_code: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  rating: number | null;
  review_count: number;
  reviews_1: number;
  reviews_2: number;
  reviews_3: number;
  reviews_4: number;
  reviews_5: number;
  photo_count: number;
  photo_url: string | null;
  logo_url: string | null;
  subtypes: string[];
  category: string | null;
  business_status: string;
  working_hours: unknown;
  booking_url: string | null;
  about: unknown;
  is_verified: boolean;
  is_laser_specialist: boolean;
  google_maps_url: string | null;
};

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function intOr(v: unknown, fallback: number): number {
  const n = num(v);
  return n === null ? fallback : Math.trunc(n);
}

function bool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s === 'true' || s === 't' || s === 'yes' || s === '1';
  }
  return false;
}

function parseJsonish(v: unknown): unknown {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'object') return v;
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    // Outscraper sometimes uses Python-style single quotes
    try {
      return JSON.parse(s.replace(/'/g, '"'));
    } catch {
      return null;
    }
  }
}

function parseSubtypes(v: unknown): string[] {
  const s = str(v);
  if (!s) return [];
  return s
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
}

function baseSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function makeSlugger() {
  const seen = new Map<string, number>();
  return (input: string): string => {
    const base = baseSlug(input) || 'item';
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };
}

async function batchUpsert<T extends Record<string, unknown>>(
  table: string,
  rows: T[],
  onConflict: string,
  size = 500,
) {
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    const { error } = await supabase
      .from(table)
      .upsert(chunk as never, { onConflict });
    if (error) {
      console.error(`Upsert into ${table} failed at rows ${i}..${i + chunk.length}:`, error);
      throw error;
    }
  }
}

async function main() {
  if (!existsSync(XLSX_PATH)) {
    console.error(`XLSX not found at ${XLSX_PATH}`);
    process.exit(1);
  }
  console.log(`Reading ${XLSX_PATH}`);
  const wb = XLSX.readFile(XLSX_PATH);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
    blankrows: false,
  });

  // Drop the header row
  const dataRows = rows.slice(1);
  console.log(`Raw rows: ${dataRows.length}`);

  let skippedStatus = 0;
  let skippedName = 0;
  let skippedNoId = 0;
  let dupesMerged = 0;

  // Deduplicate by google_place_id, keep the one with the higher review_count
  const byId = new Map<string, Provider>();

  for (const row of dataRows) {
    const name = str(row[COL.name]);
    const status = str(row[COL.business_status]);
    const placeId = str(row[COL.google_place_id]);

    if (!status || status.toUpperCase() !== 'OPERATIONAL') {
      skippedStatus++;
      continue;
    }
    if (!name) {
      skippedName++;
      continue;
    }
    if (!placeId) {
      skippedNoId++;
      continue;
    }

    const subtypes = parseSubtypes(row[COL.subtypes]);
    const provider: Provider = {
      google_place_id: placeId,
      name,
      slug: '', // assigned after dedupe
      phone: str(row[COL.phone]),
      website: str(row[COL.website]),
      address: str(row[COL.address]),
      street: str(row[COL.street]),
      city: str(row[COL.city]),
      county: str(row[COL.county]),
      state: str(row[COL.state]),
      state_code: str(row[COL.state_code])?.toUpperCase() ?? null,
      postal_code: str(row[COL.postal_code]),
      latitude: num(row[COL.latitude]),
      longitude: num(row[COL.longitude]),
      timezone: str(row[COL.timezone]),
      rating: num(row[COL.rating]),
      review_count: intOr(row[COL.review_count], 0),
      reviews_1: intOr(row[COL.reviews_1], 0),
      reviews_2: intOr(row[COL.reviews_2], 0),
      reviews_3: intOr(row[COL.reviews_3], 0),
      reviews_4: intOr(row[COL.reviews_4], 0),
      reviews_5: intOr(row[COL.reviews_5], 0),
      photo_count: intOr(row[COL.photo_count], 0),
      photo_url: str(row[COL.photo_url]),
      logo_url: str(row[COL.logo_url]),
      subtypes,
      category: str(row[COL.category]),
      business_status: status,
      working_hours: parseJsonish(row[COL.working_hours]),
      booking_url: str(row[COL.booking_url]),
      about: parseJsonish(row[COL.about]),
      is_verified: bool(row[COL.is_verified]),
      is_laser_specialist: subtypes.includes('Laser hair removal service'),
      google_maps_url: str(row[COL.google_maps_url]),
    };

    const existing = byId.get(placeId);
    if (!existing) {
      byId.set(placeId, provider);
    } else {
      dupesMerged++;
      if (provider.review_count > existing.review_count) {
        byId.set(placeId, provider);
      }
    }
  }

  // Assign slugs deterministically across the deduped set
  const slugger = makeSlugger();
  const providers = [...byId.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => ({ ...p, slug: slugger(p.name) }));

  console.log(
    `Providers to import: ${providers.length} ` +
      `(skipped: ${skippedStatus} non-operational, ${skippedName} no name, ${skippedNoId} no place_id; ` +
      `${dupesMerged} duplicate place_ids merged)`,
  );

  // Upsert providers
  await batchUpsert('providers', providers, 'google_place_id');

  // Aggregate cities
  type CityAgg = {
    name: string;
    state: string;
    state_code: string;
    ratings: number[];
    lats: number[];
    lngs: number[];
    count: number;
  };
  const cityMap = new Map<string, CityAgg>();
  for (const p of providers) {
    if (!p.city || !p.state_code) continue;
    const key = `${p.city.toLowerCase()}|${p.state_code}`;
    let agg = cityMap.get(key);
    if (!agg) {
      agg = {
        name: p.city,
        state: p.state ?? '',
        state_code: p.state_code,
        ratings: [],
        lats: [],
        lngs: [],
        count: 0,
      };
      cityMap.set(key, agg);
    }
    agg.count++;
    if (p.rating !== null) agg.ratings.push(p.rating);
    if (p.latitude !== null) agg.lats.push(p.latitude);
    if (p.longitude !== null) agg.lngs.push(p.longitude);
  }

  const citySlugger = makeSlugger();
  const cities = [...cityMap.values()]
    .sort((a, b) => `${a.state_code}-${a.name}`.localeCompare(`${b.state_code}-${b.name}`))
    .map((c) => {
      const avg = (xs: number[]) =>
        xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
      return {
        name: c.name,
        state: c.state,
        state_code: c.state_code,
        slug: citySlugger(`${c.name}-${c.state_code}`),
        provider_count: c.count,
        avg_rating: avg(c.ratings),
        latitude: avg(c.lats),
        longitude: avg(c.lngs),
      };
    });

  await batchUpsert('cities', cities, 'name,state_code');

  // Aggregate states
  type StateAgg = { name: string; code: string; providerCount: number; cities: Set<string> };
  const stateMap = new Map<string, StateAgg>();
  for (const p of providers) {
    if (!p.state_code) continue;
    let agg = stateMap.get(p.state_code);
    if (!agg) {
      agg = {
        name: p.state ?? p.state_code,
        code: p.state_code,
        providerCount: 0,
        cities: new Set(),
      };
      stateMap.set(p.state_code, agg);
    }
    agg.providerCount++;
    if (p.city) agg.cities.add(p.city.toLowerCase());
  }

  const stateSlugger = makeSlugger();
  const states = [...stateMap.values()]
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((s) => ({
      name: s.name,
      code: s.code,
      slug: stateSlugger(s.name),
      provider_count: s.providerCount,
      city_count: s.cities.size,
    }));

  await batchUpsert('states', states, 'code');

  console.log('\nImport summary');
  console.log(`  Providers imported: ${providers.length}`);
  console.log(`  Cities created:     ${cities.length}`);
  console.log(`  States created:     ${states.length}`);
  console.log(`  Duplicates merged:  ${dupesMerged}`);
  console.log(
    `  Skipped: ${skippedStatus} non-operational, ${skippedName} missing name, ${skippedNoId} missing place_id`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
