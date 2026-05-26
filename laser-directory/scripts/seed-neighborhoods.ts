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
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
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
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}
if (!SERVICE_KEY) {
  console.warn(
    'Warning: using anon key. Writes will be rejected by RLS on the neighborhoods table.',
  );
}

const supabase = createClient(SUPABASE_URL, KEY, { auth: { persistSession: false } });

type NeighborhoodSeed = {
  name: string;
  lat: number;
  lng: number;
  radiusKm?: number;
};

type CitySeed = {
  cityName: string;
  stateCode: string;
  neighborhoods: NeighborhoodSeed[];
};

// Reasonable approximate centers; radius defaults to 5 km, overridden for
// larger suburb-style "neighborhoods" that need wider catchment.
const CITY_SEEDS: CitySeed[] = [
  {
    cityName: 'New York',
    stateCode: 'NY',
    neighborhoods: [
      { name: 'Manhattan', lat: 40.7831, lng: -73.9712, radiusKm: 4 },
      { name: 'Brooklyn', lat: 40.6782, lng: -73.9442, radiusKm: 6 },
      { name: 'Queens', lat: 40.7282, lng: -73.7949, radiusKm: 8 },
      { name: 'Bronx', lat: 40.8448, lng: -73.8648, radiusKm: 6 },
      { name: 'Staten Island', lat: 40.5795, lng: -74.1502, radiusKm: 8 },
      { name: 'Upper East Side', lat: 40.7736, lng: -73.9566, radiusKm: 2 },
      { name: 'Upper West Side', lat: 40.787, lng: -73.9754, radiusKm: 2 },
      { name: 'Midtown', lat: 40.7549, lng: -73.984, radiusKm: 2 },
      { name: 'SoHo', lat: 40.7233, lng: -74.003, radiusKm: 1.5 },
      { name: 'Williamsburg', lat: 40.7081, lng: -73.9571, radiusKm: 2.5 },
    ],
  },
  {
    cityName: 'Chicago',
    stateCode: 'IL',
    neighborhoods: [
      { name: 'River North', lat: 41.8924, lng: -87.6342, radiusKm: 2 },
      { name: 'Lincoln Park', lat: 41.9214, lng: -87.6513, radiusKm: 2.5 },
      { name: 'Loop', lat: 41.8786, lng: -87.6359, radiusKm: 2 },
      { name: 'Lakeview', lat: 41.9403, lng: -87.6438, radiusKm: 2.5 },
      { name: 'Wicker Park', lat: 41.909, lng: -87.6772, radiusKm: 2 },
      { name: 'Gold Coast', lat: 41.9043, lng: -87.6266, radiusKm: 1.5 },
      { name: 'Streeterville', lat: 41.8929, lng: -87.6206, radiusKm: 1.5 },
    ],
  },
  {
    cityName: 'Austin',
    stateCode: 'TX',
    neighborhoods: [
      { name: 'Downtown Austin', lat: 30.2672, lng: -97.7431, radiusKm: 3 },
      { name: 'South Congress', lat: 30.2515, lng: -97.7497, radiusKm: 2 },
      { name: 'West Lake Hills', lat: 30.298, lng: -97.8051, radiusKm: 4 },
      { name: 'North Austin', lat: 30.4019, lng: -97.7186, radiusKm: 5 },
      { name: 'Cedar Park', lat: 30.5052, lng: -97.8203, radiusKm: 6 },
      { name: 'Round Rock', lat: 30.5083, lng: -97.6789, radiusKm: 6 },
    ],
  },
  {
    cityName: 'Dallas',
    stateCode: 'TX',
    neighborhoods: [
      { name: 'Uptown Dallas', lat: 32.8067, lng: -96.7967, radiusKm: 2.5 },
      { name: 'Highland Park', lat: 32.8302, lng: -96.7917, radiusKm: 2.5 },
      { name: 'Deep Ellum', lat: 32.7837, lng: -96.7805, radiusKm: 2 },
      { name: 'Bishop Arts', lat: 32.7472, lng: -96.8294, radiusKm: 2 },
      { name: 'Preston Hollow', lat: 32.877, lng: -96.7991, radiusKm: 3 },
      { name: 'Plano', lat: 33.0198, lng: -96.6989, radiusKm: 7 },
      { name: 'Frisco', lat: 33.1507, lng: -96.8236, radiusKm: 7 },
    ],
  },
  {
    cityName: 'Houston',
    stateCode: 'TX',
    neighborhoods: [
      { name: 'Galleria', lat: 29.7396, lng: -95.464, radiusKm: 3 },
      { name: 'Montrose', lat: 29.74, lng: -95.3905, radiusKm: 2.5 },
      { name: 'Heights', lat: 29.8004, lng: -95.3984, radiusKm: 3 },
      { name: 'Katy', lat: 29.7858, lng: -95.8245, radiusKm: 7 },
      { name: 'Sugar Land', lat: 29.5994, lng: -95.6147, radiusKm: 6 },
      { name: 'Midtown Houston', lat: 29.7405, lng: -95.3776, radiusKm: 2 },
      { name: 'River Oaks', lat: 29.751, lng: -95.4173, radiusKm: 2.5 },
    ],
  },
  {
    cityName: 'Denver',
    stateCode: 'CO',
    neighborhoods: [
      { name: 'LoDo', lat: 39.753, lng: -105.0006, radiusKm: 2 },
      { name: 'Cherry Creek', lat: 39.717, lng: -104.954, radiusKm: 2.5 },
      { name: 'Capitol Hill', lat: 39.7401, lng: -104.9821, radiusKm: 2 },
      { name: 'Highland', lat: 39.7607, lng: -105.0123, radiusKm: 2 },
      { name: 'Wash Park', lat: 39.7022, lng: -104.9714, radiusKm: 2 },
      { name: 'RiNo', lat: 39.7674, lng: -104.9821, radiusKm: 2 },
    ],
  },
  {
    cityName: 'Charlotte',
    stateCode: 'NC',
    neighborhoods: [
      { name: 'South End', lat: 35.2104, lng: -80.8568, radiusKm: 2 },
      { name: 'NoDa', lat: 35.2497, lng: -80.8067, radiusKm: 2 },
      { name: 'Dilworth', lat: 35.2092, lng: -80.8479, radiusKm: 2 },
      { name: 'Ballantyne', lat: 35.0524, lng: -80.848, radiusKm: 4 },
      { name: 'Uptown Charlotte', lat: 35.2271, lng: -80.8431, radiusKm: 2 },
      { name: 'Myers Park', lat: 35.1864, lng: -80.8327, radiusKm: 2 },
    ],
  },
  {
    cityName: 'Jacksonville',
    stateCode: 'FL',
    neighborhoods: [
      { name: 'San Marco', lat: 30.306, lng: -81.6477, radiusKm: 2.5 },
      { name: 'Riverside', lat: 30.312, lng: -81.6886, radiusKm: 2.5 },
      { name: 'Jacksonville Beach', lat: 30.2945, lng: -81.3933, radiusKm: 4 },
      { name: 'Ponte Vedra', lat: 30.2394, lng: -81.3854, radiusKm: 5 },
      { name: 'Southside', lat: 30.2697, lng: -81.5586, radiusKm: 4 },
    ],
  },
  {
    cityName: 'Nashville',
    stateCode: 'TN',
    neighborhoods: [
      { name: 'The Gulch', lat: 36.15, lng: -86.7833, radiusKm: 2 },
      { name: 'East Nashville', lat: 36.1781, lng: -86.7427, radiusKm: 3 },
      { name: 'Green Hills', lat: 36.1059, lng: -86.8146, radiusKm: 3 },
      { name: '12 South', lat: 36.1167, lng: -86.79, radiusKm: 2 },
      { name: 'Germantown', lat: 36.1763, lng: -86.7895, radiusKm: 2 },
      { name: 'Brentwood', lat: 35.9787, lng: -86.7905, radiusKm: 6 },
    ],
  },
  {
    cityName: 'Colorado Springs',
    stateCode: 'CO',
    neighborhoods: [
      { name: 'Old Colorado City', lat: 38.8478, lng: -104.8728, radiusKm: 2.5 },
      { name: 'Manitou Springs', lat: 38.8597, lng: -104.9172, radiusKm: 3 },
      { name: 'Briargate', lat: 38.9559, lng: -104.766, radiusKm: 4 },
      { name: 'Downtown CO Springs', lat: 38.8339, lng: -104.8214, radiusKm: 3 },
    ],
  },
  {
    cityName: 'Phoenix',
    stateCode: 'AZ',
    neighborhoods: [
      { name: 'Scottsdale', lat: 33.4942, lng: -111.9261, radiusKm: 6 },
      { name: 'Tempe', lat: 33.4255, lng: -111.94, radiusKm: 5 },
      { name: 'Mesa', lat: 33.4152, lng: -111.8315, radiusKm: 6 },
      { name: 'Chandler', lat: 33.3062, lng: -111.8413, radiusKm: 6 },
      { name: 'Gilbert', lat: 33.3528, lng: -111.789, radiusKm: 6 },
      { name: 'Paradise Valley', lat: 33.5312, lng: -111.9426, radiusKm: 4 },
      { name: 'Arcadia', lat: 33.5028, lng: -111.9806, radiusKm: 3 },
    ],
  },
  {
    cityName: 'San Antonio',
    stateCode: 'TX',
    neighborhoods: [
      { name: 'Alamo Heights', lat: 29.4849, lng: -98.4583, radiusKm: 2.5 },
      { name: 'Stone Oak', lat: 29.6172, lng: -98.4769, radiusKm: 4 },
      { name: 'The Pearl', lat: 29.4435, lng: -98.4783, radiusKm: 2 },
      { name: 'Southtown', lat: 29.4138, lng: -98.4928, radiusKm: 2 },
      { name: 'Medical Center', lat: 29.5054, lng: -98.5705, radiusKm: 3 },
    ],
  },
  {
    cityName: 'Indianapolis',
    stateCode: 'IN',
    neighborhoods: [
      { name: 'Broad Ripple', lat: 39.8703, lng: -86.139, radiusKm: 2.5 },
      { name: 'Carmel', lat: 39.9784, lng: -86.118, radiusKm: 6 },
      { name: 'Fishers', lat: 39.9568, lng: -86.0135, radiusKm: 6 },
      { name: 'Mass Ave', lat: 39.7728, lng: -86.1485, radiusKm: 2 },
      { name: 'Meridian-Kessler', lat: 39.8513, lng: -86.1583, radiusKm: 2.5 },
    ],
  },
  {
    cityName: 'Fort Worth',
    stateCode: 'TX',
    neighborhoods: [
      { name: 'Sundance Square', lat: 32.753, lng: -97.33, radiusKm: 2 },
      { name: 'TCU Area', lat: 32.7106, lng: -97.3623, radiusKm: 2.5 },
      { name: 'Southlake', lat: 32.9412, lng: -97.1342, radiusKm: 6 },
      { name: 'Keller', lat: 32.9346, lng: -97.2306, radiusKm: 5 },
      { name: 'Clearfork', lat: 32.7115, lng: -97.4015, radiusKm: 3 },
    ],
  },
  {
    cityName: 'Miami',
    stateCode: 'FL',
    neighborhoods: [
      { name: 'South Beach', lat: 25.7826, lng: -80.1303, radiusKm: 2.5 },
      { name: 'Brickell', lat: 25.7611, lng: -80.1922, radiusKm: 2 },
      { name: 'Coral Gables', lat: 25.7215, lng: -80.2683, radiusKm: 4 },
      { name: 'Wynwood', lat: 25.8009, lng: -80.1989, radiusKm: 2 },
      { name: 'Coconut Grove', lat: 25.728, lng: -80.2454, radiusKm: 2.5 },
      { name: 'Aventura', lat: 25.9565, lng: -80.1394, radiusKm: 4 },
      { name: 'Doral', lat: 25.8195, lng: -80.3553, radiusKm: 4 },
    ],
  },
];

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

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function fetchProvidersInBox(
  lat: number,
  lng: number,
  radiusKm: number,
): Promise<{ id: string; rating: number | null; latitude: number | null; longitude: number | null }[]> {
  // Approximate bounding box; 1 deg lat ≈ 111km; 1 deg lng ≈ 111km * cos(lat)
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.max(0.01, Math.cos((lat * Math.PI) / 180)));
  const { data, error } = await supabase
    .from('providers')
    .select('id, rating, latitude, longitude')
    .gte('latitude', lat - latDelta)
    .lte('latitude', lat + latDelta)
    .gte('longitude', lng - lngDelta)
    .lte('longitude', lng + lngDelta)
    .limit(5000);
  if (error) throw error;
  return (data ?? []) as Array<{
    id: string;
    rating: number | null;
    latitude: number | null;
    longitude: number | null;
  }>;
}

async function main() {
  console.log('Seeding neighborhoods…\n');

  // Resolve state slug per state_code
  const { data: states, error: statesErr } = await supabase.from('states').select('code, slug');
  if (statesErr) throw statesErr;
  const stateSlugByCode = new Map<string, string>();
  for (const s of states ?? []) stateSlugByCode.set(s.code, s.slug);

  // Resolve city slug per (state_code, lowercased city name)
  const { data: cities, error: citiesErr } = await supabase
    .from('cities')
    .select('name, slug, state_code');
  if (citiesErr) throw citiesErr;
  const citySlugByKey = new Map<string, string>();
  for (const c of cities ?? []) {
    citySlugByKey.set(`${c.state_code}|${c.name.toLowerCase()}`, c.slug);
  }

  // Track slug uniqueness across the whole set
  const usedSlugs = new Set<string>();

  let inserted = 0;
  let skipped = 0;
  let totalProvidersMapped = 0;

  for (const city of CITY_SEEDS) {
    const stateSlug = stateSlugByCode.get(city.stateCode);
    const citySlug = citySlugByKey.get(`${city.stateCode}|${city.cityName.toLowerCase()}`);
    if (!stateSlug || !citySlug) {
      console.warn(
        `  Skipping all neighborhoods for ${city.cityName}, ${city.stateCode} — city row not found in database. Run import-data first.`,
      );
      continue;
    }

    console.log(`${city.cityName}, ${city.stateCode}`);
    for (const n of city.neighborhoods) {
      const radius = n.radiusKm ?? 5;
      const candidates = await fetchProvidersInBox(n.lat, n.lng, radius);
      const within = candidates.filter((p) => {
        if (p.latitude === null || p.longitude === null) return false;
        return haversineKm(n.lat, n.lng, p.latitude, p.longitude) <= radius;
      });
      if (within.length === 0) {
        console.log(`  - ${n.name}: 0 providers within ${radius}km — skipping`);
        skipped++;
        continue;
      }

      const ratings = within
        .map((p) => p.rating)
        .filter((r): r is number => typeof r === 'number' && Number.isFinite(r));
      const avg =
        ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : null;

      // Unique slug — try bare name; if taken, append city slug
      let slug = baseSlug(n.name);
      if (usedSlugs.has(slug)) slug = `${slug}-${citySlug}`;
      usedSlugs.add(slug);

      const { error: upsertErr } = await supabase
        .from('neighborhoods')
        .upsert(
          {
            name: n.name,
            slug,
            city: city.cityName,
            city_slug: citySlug,
            state_code: city.stateCode,
            state_slug: stateSlug,
            latitude: n.lat,
            longitude: n.lng,
            radius_km: radius,
            provider_count: within.length,
            avg_rating: avg,
          },
          { onConflict: 'slug' },
        );
      if (upsertErr) {
        console.error(`  Failed to upsert ${n.name}:`, upsertErr);
        continue;
      }

      inserted++;
      totalProvidersMapped += within.length;
      console.log(
        `  + ${n.name} (/${stateSlug}/${citySlug}/near/${slug}) — ${within.length} providers, avg ${avg !== null ? avg.toFixed(2) : 'N/A'}`,
      );
    }
  }

  console.log('');
  console.log('Done.');
  console.log(`  Neighborhoods created/updated: ${inserted}`);
  console.log(`  Neighborhoods skipped (no providers): ${skipped}`);
  console.log(`  Total provider rows mapped: ${totalProvidersMapped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
