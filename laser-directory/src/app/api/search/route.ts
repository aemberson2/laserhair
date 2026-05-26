import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';
// Don't statically cache zip-code lookups; the dataset changes when imports
// run and we want fresh results for every search.
export const dynamic = 'force-dynamic';

export type SearchResult = {
  name: string;
  stateCode: string;
  stateSlug: string;
  citySlug: string;
  providerCount: number;
  matchedPostal: string;
};

const ZIP_PATTERN = /^\d{3,5}(-\d{0,4})?$/;

export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const raw = (url.searchParams.get('q') ?? '').trim();
  if (!raw) return NextResponse.json([] satisfies SearchResult[]);

  // Only handle numeric (zip) queries server-side; text city search stays
  // client-side in CitySearchBox.
  if (!ZIP_PATTERN.test(raw)) {
    return NextResponse.json([] satisfies SearchResult[]);
  }

  // Strip the +4 suffix; treat the leading 3–5 digits as a prefix.
  const zipPrefix = raw.split('-')[0];

  try {
    const supabase = getSupabase();

    const { data: providers, error } = await supabase
      .from('providers')
      .select('city, state_code, postal_code')
      .like('postal_code', `${zipPrefix}%`)
      .not('city', 'is', null)
      .not('state_code', 'is', null)
      .limit(500);
    if (error) throw error;

    type Agg = { city: string; stateCode: string; matchedPostal: string; count: number };
    const counts = new Map<string, Agg>();
    for (const p of providers ?? []) {
      if (!p.city || !p.state_code) continue;
      const key = `${p.state_code}|${p.city.toLowerCase()}`;
      let agg = counts.get(key);
      if (!agg) {
        agg = {
          city: p.city,
          stateCode: p.state_code,
          matchedPostal: p.postal_code ?? zipPrefix,
          count: 0,
        };
        counts.set(key, agg);
      }
      agg.count++;
    }

    if (counts.size === 0) return NextResponse.json([] satisfies SearchResult[]);

    // Look up slugs for the state codes and (state_code, city) pairs we matched.
    const stateCodes = [...new Set([...counts.values()].map((v) => v.stateCode))];
    const [statesRes, citiesRes] = await Promise.all([
      supabase.from('states').select('code, slug').in('code', stateCodes),
      supabase.from('cities').select('name, slug, state_code').in('state_code', stateCodes),
    ]);
    if (statesRes.error) throw statesRes.error;
    if (citiesRes.error) throw citiesRes.error;

    const stateSlugByCode = new Map<string, string>();
    for (const s of statesRes.data ?? []) stateSlugByCode.set(s.code, s.slug);
    const citySlugByKey = new Map<string, string>();
    for (const c of citiesRes.data ?? []) {
      citySlugByKey.set(`${c.state_code}|${c.name.toLowerCase()}`, c.slug);
    }

    const results: SearchResult[] = [...counts.values()]
      .map((v): SearchResult | null => {
        const stateSlug = stateSlugByCode.get(v.stateCode);
        const citySlug = citySlugByKey.get(`${v.stateCode}|${v.city.toLowerCase()}`);
        if (!stateSlug || !citySlug) return null;
        return {
          name: v.city,
          stateCode: v.stateCode,
          stateSlug,
          citySlug,
          providerCount: v.count,
          matchedPostal: v.matchedPostal,
        };
      })
      .filter((r): r is SearchResult => r !== null)
      .sort((a, b) => b.providerCount - a.providerCount)
      .slice(0, 8);

    return NextResponse.json(results);
  } catch (err) {
    console.error('[search] handler error:', err);
    return NextResponse.json([] satisfies SearchResult[], { status: 500 });
  }
}
