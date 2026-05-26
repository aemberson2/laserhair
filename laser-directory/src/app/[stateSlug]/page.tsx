import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import {
  BuildingIcon,
  MapPinIcon,
  StarIcon,
} from '@/components/Icons';
import { ProviderCard } from '@/components/ProviderCard';
import {
  getAllStateSlugs,
  getStatePageData,
  getStatesByCodes,
  getTopStatesNationwide,
  providerHref,
} from '@/lib/data';
import { getSiteUrl } from '@/lib/site';
import { NEIGHBORING_STATE_CODES } from '@/lib/states-adjacency';

export const revalidate = 3600;

type Params = { stateSlug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await getAllStateSlugs();
  return slugs.map((stateSlug) => ({ stateSlug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { stateSlug } = await params;
  const data = await getStatePageData(stateSlug);
  if (!data) return { title: 'State not found' };
  const { state } = data;
  const providers = state.provider_count.toLocaleString();
  const cities = state.city_count.toLocaleString();
  return {
    title: `Laser Hair Removal in ${state.name} — ${providers} Providers`,
    description: `Find ${providers} laser hair removal providers across ${cities} cities in ${state.name}. Compare ratings, read reviews, and book appointments.`,
  };
}

export default async function StatePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { stateSlug } = await params;
  const data = await getStatePageData(stateSlug);
  if (!data) notFound();

  const { state, cities, topProviders, avgRating } = data;

  const neighborCodes = NEIGHBORING_STATE_CODES[state.code] ?? [];
  const [neighborStates, topStatesAll] = await Promise.all([
    getStatesByCodes([...neighborCodes]),
    getTopStatesNationwide(10),
  ]);
  // Preserve the adjacency-list order
  const neighborOrder = new Map(neighborCodes.map((c, i) => [c, i]));
  const neighbors = neighborStates
    .slice()
    .sort((a, b) => (neighborOrder.get(a.code) ?? 99) - (neighborOrder.get(b.code) ?? 99));
  const topStates = topStatesAll.filter((s) => s.slug !== state.slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <Breadcrumb
        baseUrl={getSiteUrl()}
        items={[
          { label: 'Home', href: '/' },
          { label: state.name, href: `/${state.slug}` },
        ]}
      />

      <header className="mt-5">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Laser Hair Removal in {state.name}
        </h1>
        <p className="mt-2 text-slate-600">
          Browse every operating provider in {state.name}, sorted by rating and reviews.
        </p>
      </header>

      <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat
          label="Providers"
          value={state.provider_count.toLocaleString()}
          tint="teal"
          icon={<BuildingIcon className="h-5 w-5" />}
        />
        <Stat
          label="Cities"
          value={state.city_count.toLocaleString()}
          tint="rose"
          icon={<MapPinIcon className="h-5 w-5" />}
        />
        <Stat
          label="Average rating"
          value={avgRating !== null ? avgRating.toFixed(2) : '—'}
          tint="amber"
          icon={<StarIcon className="h-5 w-5" />}
        />
      </dl>

      {cities.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Cities in {state.name}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {cities.length} {cities.length === 1 ? 'city' : 'cities'} with at least one provider.
          </p>
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cities.map((city) => (
              <li key={city.slug}>
                <Link
                  href={`/${state.slug}/${city.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-150 ease-out hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-900 group-hover:text-teal-700">
                      {city.name}
                    </p>
                    {city.avg_rating !== null && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                        <StarIcon className="h-3 w-3" />
                        {city.avg_rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {city.provider_count.toLocaleString()}{' '}
                    {city.provider_count === 1 ? 'provider' : 'providers'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {topProviders.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Top Rated in {state.name}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Ranked by rating and review volume.
          </p>
          <ul className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {topProviders.map((p) => (
              <li key={p.slug}>
                <ProviderCard
                  provider={p}
                  href={
                    p.citySlug
                      ? providerHref(state.slug, p.citySlug, p.slug)
                      : `/${state.slug}`
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {neighbors.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Neighboring States
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Looking just over the border from {state.name}? Try these.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {neighbors.map((s) => (
              <li key={s.code}>
                <Link
                  href={`/${s.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition duration-150 hover:border-teal-300 hover:text-teal-700"
                >
                  {s.name}
                  <span className="text-slate-400">{s.code}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {topStates.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Top States for Laser Hair Removal
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            States with the most listed providers in our directory.
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {topStates.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/${s.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-150 ease-out hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
                >
                  <p className="font-semibold text-slate-900 group-hover:text-teal-700">
                    {s.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {s.provider_count.toLocaleString()} providers
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

type Tint = 'teal' | 'rose' | 'amber';
const TINTS: Record<Tint, { bg: string; text: string; ring: string }> = {
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', ring: 'ring-teal-200' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
};

function Stat({
  label,
  value,
  icon,
  tint,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tint: Tint;
}) {
  const t = TINTS[tint];
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${t.bg} ${t.text} ring-1 ring-inset ${t.ring}`}
      >
        {icon}
      </div>
      <div>
        <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </dt>
        <dd className="mt-0.5 text-2xl font-bold text-slate-900">{value}</dd>
      </div>
    </div>
  );
}