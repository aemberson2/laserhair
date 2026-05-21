import { getSupabase } from './supabase';

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
