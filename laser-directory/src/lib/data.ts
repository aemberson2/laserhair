import { getSupabase } from './supabase';
import type { ProviderCardData } from '@/components/ProviderCard';

export type NeighborhoodRow = {
  name: string;
  slug: string;
  city: string;
  city_slug: string;
  state_code: string;
  state_slug: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  provider_count: number;
  avg_rating: number | null;
};

export type ProviderWithDistance = ProviderCardData & { distance_miles: number };

export type NeighborhoodPageData = {
  neighborhood: NeighborhoodRow;
  providers: ProviderWithDistance[];
  siblings: { name: string; slug: string; provider_count: number }[];
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function getAllNeighborhoodParams(): Promise<
  { stateSlug: string; citySlug: string; neighborhoodSlug: string }[]
> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('neighborhoods')
      .select('slug, city_slug, state_slug');
    if (error) throw error;
    return (data ?? []).map((n) => ({
      stateSlug: n.state_slug,
      citySlug: n.city_slug,
      neighborhoodSlug: n.slug,
    }));
  } catch (err) {
    console.warn('getAllNeighborhoodParams failed, returning empty:', err);
    return [];
  }
}

export async function getNeighborhoodsForCity(
  citySlug: string,
): Promise<NeighborhoodRow[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('neighborhoods')
      .select(
        'name, slug, city, city_slug, state_code, state_slug, latitude, longitude, radius_km, provider_count, avg_rating',
      )
      .eq('city_slug', citySlug)
      .order('provider_count', { ascending: false });
    if (error) throw error;
    return (data ?? []) as NeighborhoodRow[];
  } catch (err) {
    console.warn(`getNeighborhoodsForCity(${citySlug}) failed:`, err);
    return [];
  }
}

export async function getNeighborhoodPageData(
  stateSlug: string,
  citySlug: string,
  neighborhoodSlug: string,
): Promise<NeighborhoodPageData | null> {
  try {
    const supabase = getSupabase();
    const { data: hood, error: hoodErr } = await supabase
      .from('neighborhoods')
      .select(
        'name, slug, city, city_slug, state_code, state_slug, latitude, longitude, radius_km, provider_count, avg_rating',
      )
      .eq('slug', neighborhoodSlug)
      .maybeSingle();
    if (hoodErr) throw hoodErr;
    if (!hood) return null;
    if (hood.state_slug !== stateSlug || hood.city_slug !== citySlug) return null;

    // Bounding box query for providers around the neighborhood center
    const latDelta = hood.radius_km / 111;
    const lngDelta =
      hood.radius_km / (111 * Math.max(0.01, Math.cos((hood.latitude * Math.PI) / 180)));

    const { data: candidates, error: provErr } = await supabase
      .from('providers')
      .select(
        'slug, name, photo_url, address, phone, website, booking_url, rating, review_count, subtypes, is_verified, is_laser_specialist, latitude, longitude',
      )
      .gte('latitude', hood.latitude - latDelta)
      .lte('latitude', hood.latitude + latDelta)
      .gte('longitude', hood.longitude - lngDelta)
      .lte('longitude', hood.longitude + lngDelta)
      .limit(2000);
    if (provErr) throw provErr;

    const providers: ProviderWithDistance[] = (candidates ?? [])
      .map((p): ProviderWithDistance | null => {
        if (p.latitude === null || p.longitude === null) return null;
        const km = haversineKm(hood.latitude, hood.longitude, p.latitude, p.longitude);
        if (km > hood.radius_km) return null;
        return {
          slug: p.slug,
          name: p.name,
          photo_url: p.photo_url,
          address: p.address,
          phone: p.phone,
          website: p.website,
          booking_url: p.booking_url,
          rating: p.rating,
          review_count: p.review_count,
          subtypes: p.subtypes,
          is_verified: p.is_verified,
          is_laser_specialist: p.is_laser_specialist,
          distance_miles: km * 0.621371,
        };
      })
      .filter((p): p is ProviderWithDistance => p !== null)
      .sort((a, b) => a.distance_miles - b.distance_miles);

    const { data: siblings } = await supabase
      .from('neighborhoods')
      .select('name, slug, provider_count')
      .eq('city_slug', citySlug)
      .neq('slug', hood.slug)
      .order('provider_count', { ascending: false })
      .limit(8);

    return {
      neighborhood: hood as NeighborhoodRow,
      providers,
      siblings: (siblings ?? []) as { name: string; slug: string; provider_count: number }[],
    };
  } catch (err) {
    console.warn(
      `getNeighborhoodPageData(${stateSlug}/${citySlug}/${neighborhoodSlug}) failed:`,
      err,
    );
    return null;
  }
}

export type TopState = {
  name: string;
  slug: string;
  provider_count: number;
};

export type TopCity = {
  name: string;
  slug: string;
  state_code: string;
  state_slug: string;
  provider_count: number;
  avg_rating: number | null;
};

export type HomeData = {
  totalProviders: number;
  totalCities: number;
  topStates: TopState[];
  topCities: TopCity[];
};

const EMPTY: HomeData = {
  totalProviders: 0,
  totalCities: 0,
  topStates: [],
  topCities: [],
};

export async function getHomeData(): Promise<HomeData> {
  try {
    const supabase = getSupabase();

    const [providerCountRes, cityCountRes, topStatesRes, topCitiesRes] =
      await Promise.all([
        supabase.from('providers').select('*', { count: 'exact', head: true }),
        supabase.from('cities').select('*', { count: 'exact', head: true }),
        supabase
          .from('states')
          .select('name, slug, provider_count')
          .order('provider_count', { ascending: false })
          .limit(10),
        supabase
          .from('cities')
          .select('name, slug, state_code, provider_count, avg_rating')
          .order('provider_count', { ascending: false })
          .limit(10),
      ]);

    if (topStatesRes.error) throw topStatesRes.error;
    if (topCitiesRes.error) throw topCitiesRes.error;

    const cities = topCitiesRes.data ?? [];
    const stateCodes = [...new Set(cities.map((c) => c.state_code))];
    const stateSlugMap = new Map<string, string>();
    if (stateCodes.length > 0) {
      const { data: stateRows } = await supabase
        .from('states')
        .select('code, slug')
        .in('code', stateCodes);
      for (const row of stateRows ?? []) {
        stateSlugMap.set(row.code, row.slug);
      }
    }

    return {
      totalProviders: providerCountRes.count ?? 0,
      totalCities: cityCountRes.count ?? 0,
      topStates: (topStatesRes.data ?? []) as TopState[],
      topCities: cities.map((c) => ({
        name: c.name,
        slug: c.slug,
        state_code: c.state_code,
        state_slug: stateSlugMap.get(c.state_code) ?? '',
        provider_count: c.provider_count,
        avg_rating: c.avg_rating,
      })),
    };
  } catch (err) {
    console.warn('getHomeData failed, returning empty data:', err);
    return EMPTY;
  }
}

export type StateRow = {
  name: string;
  code: string;
  slug: string;
  provider_count: number;
  city_count: number;
};

export type CityListItem = {
  name: string;
  slug: string;
  provider_count: number;
  avg_rating: number | null;
};

export type TopProvider = ProviderCardData & { citySlug: string | null };

export type StatePageData = {
  state: StateRow;
  cities: CityListItem[];
  topProviders: TopProvider[];
  avgRating: number | null;
};

export async function getAllStateSlugs(): Promise<string[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('states').select('slug');
    if (error) throw error;
    return (data ?? []).map((r) => r.slug);
  } catch (err) {
    console.warn('getAllStateSlugs failed, returning empty:', err);
    return [];
  }
}

export type StatesListItem = {
  name: string;
  code: string;
  slug: string;
  provider_count: number;
  city_count: number;
};

export async function getAllStatesAlphabetical(): Promise<StatesListItem[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('states')
      .select('name, code, slug, provider_count, city_count')
      .order('name', { ascending: true });
    if (error) throw error;
    return (data ?? []) as StatesListItem[];
  } catch (err) {
    console.warn('getAllStatesAlphabetical failed, returning empty:', err);
    return [];
  }
}

export type CitySearchEntry = {
  name: string;
  stateCode: string;
  stateSlug: string;
  citySlug: string;
};

export async function getAllCitiesForSearch(): Promise<CitySearchEntry[]> {
  try {
    const supabase = getSupabase();
    const [statesRes, citiesRes] = await Promise.all([
      supabase.from('states').select('code, slug'),
      supabase
        .from('cities')
        .select('name, slug, state_code')
        .order('provider_count', { ascending: false }),
    ]);
    if (statesRes.error) throw statesRes.error;
    if (citiesRes.error) throw citiesRes.error;
    const stateSlugByCode = new Map<string, string>();
    for (const s of statesRes.data ?? []) stateSlugByCode.set(s.code, s.slug);
    return (citiesRes.data ?? [])
      .map((c): CitySearchEntry | null => {
        const stateSlug = stateSlugByCode.get(c.state_code);
        return stateSlug
          ? { name: c.name, stateCode: c.state_code, stateSlug, citySlug: c.slug }
          : null;
      })
      .filter((c): c is CitySearchEntry => c !== null);
  } catch (err) {
    console.warn('getAllCitiesForSearch failed, returning empty:', err);
    return [];
  }
}

export async function getStatePageData(slug: string): Promise<StatePageData | null> {
  try {
    const supabase = getSupabase();

    const { data: state, error: stateErr } = await supabase
      .from('states')
      .select('name, code, slug, provider_count, city_count')
      .eq('slug', slug)
      .maybeSingle();
    if (stateErr) throw stateErr;
    if (!state) return null;

    const [citiesRes, ratingsRes, topProvidersRes] = await Promise.all([
      supabase
        .from('cities')
        .select('name, slug, provider_count, avg_rating')
        .eq('state_code', state.code)
        .order('provider_count', { ascending: false }),
      supabase.from('providers').select('rating').eq('state_code', state.code),
      supabase
        .from('providers')
        .select(
          'slug, name, photo_url, address, phone, website, booking_url, rating, review_count, subtypes, is_verified, is_laser_specialist, city',
        )
        .eq('state_code', state.code)
        .not('rating', 'is', null)
        .order('review_count', { ascending: false })
        .limit(100),
    ]);

    if (citiesRes.error) throw citiesRes.error;
    if (ratingsRes.error) throw ratingsRes.error;
    if (topProvidersRes.error) throw topProvidersRes.error;

    const ratings = (ratingsRes.data ?? [])
      .map((r) => (typeof r.rating === 'number' ? r.rating : null))
      .filter((r): r is number => r !== null);
    const avgRating =
      ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : null;

    const citySlugByName = new Map<string, string>();
    for (const c of citiesRes.data ?? []) {
      citySlugByName.set(c.name.toLowerCase(), c.slug);
    }

    const candidates = (topProvidersRes.data ?? []) as Array<
      ProviderCardData & { city: string | null }
    >;
    const topProviders: TopProvider[] = candidates
      .map((p) => ({
        provider: p,
        score: (p.rating ?? 0) * (p.review_count ?? 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ provider }) => {
        const { city, ...rest } = provider;
        return {
          ...rest,
          citySlug: city ? citySlugByName.get(city.toLowerCase()) ?? null : null,
        };
      });

    return {
      state,
      cities: (citiesRes.data ?? []) as CityListItem[],
      topProviders,
      avgRating,
    };
  } catch (err) {
    console.warn(`getStatePageData(${slug}) failed:`, err);
    return null;
  }
}

export function providerHref(
  stateSlug: string,
  citySlug: string,
  providerSlug: string,
): string {
  return `/${stateSlug}/${citySlug}/${providerSlug}`;
}

export type CityPageData = {
  state: { name: string; slug: string; code: string };
  city: { name: string; slug: string; state_code: string };
  providers: ProviderCardData[];
  nearbyCities: { name: string; slug: string; provider_count: number }[];
};

export async function getAllCityParams(): Promise<
  { stateSlug: string; citySlug: string }[]
> {
  try {
    const supabase = getSupabase();
    const [statesRes, citiesRes] = await Promise.all([
      supabase.from('states').select('code, slug'),
      supabase.from('cities').select('slug, state_code'),
    ]);
    if (statesRes.error) throw statesRes.error;
    if (citiesRes.error) throw citiesRes.error;
    const stateSlugByCode = new Map<string, string>();
    for (const s of statesRes.data ?? []) stateSlugByCode.set(s.code, s.slug);
    return (citiesRes.data ?? [])
      .map((c) => {
        const stateSlug = stateSlugByCode.get(c.state_code);
        return stateSlug ? { stateSlug, citySlug: c.slug } : null;
      })
      .filter((p): p is { stateSlug: string; citySlug: string } => p !== null);
  } catch (err) {
    console.warn('getAllCityParams failed, returning empty:', err);
    return [];
  }
}

export type ProviderFull = {
  slug: string;
  google_place_id: string;
  name: string;
  phone: string | null;
  website: string | null;
  address: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  state_code: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  rating: number | null;
  review_count: number | null;
  reviews_1: number | null;
  reviews_2: number | null;
  reviews_3: number | null;
  reviews_4: number | null;
  reviews_5: number | null;
  photo_url: string | null;
  logo_url: string | null;
  subtypes: string[] | null;
  category: string | null;
  business_status: string | null;
  working_hours: unknown;
  booking_url: string | null;
  about: unknown;
  is_verified: boolean | null;
  is_laser_specialist: boolean | null;
  google_maps_url: string | null;
};

export type ProviderPageData = {
  state: { name: string; slug: string; code: string };
  city: { name: string; slug: string };
  provider: ProviderFull;
  nearby: ProviderCardData[];
};

export async function getAllProviderParams(): Promise<
  { stateSlug: string; citySlug: string; providerSlug: string }[]
> {
  try {
    const supabase = getSupabase();
    const [statesRes, citiesRes, providersRes] = await Promise.all([
      supabase.from('states').select('code, slug'),
      supabase.from('cities').select('name, slug, state_code'),
      supabase.from('providers').select('slug, city, state_code'),
    ]);
    if (statesRes.error) throw statesRes.error;
    if (citiesRes.error) throw citiesRes.error;
    if (providersRes.error) throw providersRes.error;

    const stateSlugByCode = new Map<string, string>();
    for (const s of statesRes.data ?? []) stateSlugByCode.set(s.code, s.slug);

    const citySlugByKey = new Map<string, string>();
    for (const c of citiesRes.data ?? []) {
      citySlugByKey.set(`${c.state_code}|${c.name.toLowerCase()}`, c.slug);
    }

    const params: { stateSlug: string; citySlug: string; providerSlug: string }[] = [];
    for (const p of providersRes.data ?? []) {
      if (!p.state_code || !p.city) continue;
      const stateSlug = stateSlugByCode.get(p.state_code);
      const citySlug = citySlugByKey.get(`${p.state_code}|${p.city.toLowerCase()}`);
      if (!stateSlug || !citySlug) continue;
      params.push({ stateSlug, citySlug, providerSlug: p.slug });
    }
    return params;
  } catch (err) {
    console.warn('getAllProviderParams failed, returning empty:', err);
    return [];
  }
}

export async function getProviderPageData(
  stateSlug: string,
  citySlug: string,
  providerSlug: string,
): Promise<ProviderPageData | null> {
  try {
    const supabase = getSupabase();
    const { data: state, error: stateErr } = await supabase
      .from('states')
      .select('name, code, slug')
      .eq('slug', stateSlug)
      .maybeSingle();
    if (stateErr) throw stateErr;
    if (!state) return null;

    const { data: city, error: cityErr } = await supabase
      .from('cities')
      .select('name, slug, state_code')
      .eq('slug', citySlug)
      .maybeSingle();
    if (cityErr) throw cityErr;
    if (!city || city.state_code !== state.code) return null;

    const { data: provider, error: provErr } = await supabase
      .from('providers')
      .select('*')
      .eq('slug', providerSlug)
      .maybeSingle();
    if (provErr) throw provErr;
    if (!provider) return null;
    if (
      provider.state_code !== state.code ||
      (provider.city ?? '').toLowerCase() !== city.name.toLowerCase()
    ) {
      return null;
    }

    const { data: nearbyRows, error: nearbyErr } = await supabase
      .from('providers')
      .select(
        'slug, name, photo_url, address, phone, website, booking_url, rating, review_count, subtypes, is_verified, is_laser_specialist',
      )
      .eq('state_code', state.code)
      .eq('city', city.name)
      .neq('slug', provider.slug)
      .order('rating', { ascending: false, nullsFirst: false })
      .order('review_count', { ascending: false })
      .limit(6);
    if (nearbyErr) throw nearbyErr;

    return {
      state,
      city: { name: city.name, slug: city.slug },
      provider: provider as ProviderFull,
      nearby: (nearbyRows ?? []) as ProviderCardData[],
    };
  } catch (err) {
    console.warn(
      `getProviderPageData(${stateSlug}/${citySlug}/${providerSlug}) failed:`,
      err,
    );
    return null;
  }
}

export async function getCityPageData(
  stateSlug: string,
  citySlug: string,
): Promise<CityPageData | null> {
  try {
    const supabase = getSupabase();
    const { data: state, error: stateErr } = await supabase
      .from('states')
      .select('name, code, slug')
      .eq('slug', stateSlug)
      .maybeSingle();
    if (stateErr) throw stateErr;
    if (!state) return null;

    const { data: city, error: cityErr } = await supabase
      .from('cities')
      .select('name, slug, state_code')
      .eq('slug', citySlug)
      .maybeSingle();
    if (cityErr) throw cityErr;
    if (!city || city.state_code !== state.code) return null;

    const [providersRes, nearbyRes] = await Promise.all([
      supabase
        .from('providers')
        .select(
          'slug, name, photo_url, address, phone, website, booking_url, rating, review_count, subtypes, is_verified, is_laser_specialist',
        )
        .eq('state_code', state.code)
        .eq('city', city.name)
        .order('rating', { ascending: false, nullsFirst: false })
        .order('review_count', { ascending: false }),
      supabase
        .from('cities')
        .select('name, slug, provider_count')
        .eq('state_code', state.code)
        .neq('slug', city.slug)
        .order('provider_count', { ascending: false })
        .limit(5),
    ]);

    if (providersRes.error) throw providersRes.error;
    if (nearbyRes.error) throw nearbyRes.error;

    return {
      state,
      city,
      providers: (providersRes.data ?? []) as ProviderCardData[],
      nearbyCities: nearbyRes.data ?? [],
    };
  } catch (err) {
    console.warn(`getCityPageData(${stateSlug}/${citySlug}) failed:`, err);
    return null;
  }
}
