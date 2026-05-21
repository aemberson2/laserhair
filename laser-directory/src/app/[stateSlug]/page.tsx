import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ProviderCard } from '@/components/ProviderCard';
import { StarRating } from '@/components/StarRating';
import {
  getAllStateSlugs,
  getStatePageData,
  providerHref,
} from '@/lib/data';

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: state.name, href: `/${state.slug}` },
        ]}
      />

      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Laser Hair Removal in {state.name}
        </h1>
      </header>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Providers" value={state.provider_count.toLocaleString()} />
        <Stat label="Cities" value={state.city_count.toLocaleString()} />
        <Stat
          label="Average rating"
          value={avgRating !== null ? avgRating.toFixed(2) : '—'}
        />
      </dl>

      {cities.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-gray-900">
            Cities in {state.name}
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cities.map((city) => (
              <li key={city.slug}>
                <Link
                  href={`/${state.slug}/${city.slug}`}
                  className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-teal-600 hover:shadow-sm"
                >
                  <p className="font-medium text-gray-900">{city.name}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {city.provider_count.toLocaleString()}{' '}
                    {city.provider_count === 1 ? 'provider' : 'providers'}
                  </p>
                  {city.avg_rating !== null && (
                    <div className="mt-2">
                      <StarRating
                        rating={city.avg_rating}
                        reviewCount={0}
                        showCount={false}
                      />
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {topProviders.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900">
            Top Rated in {state.name}
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
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
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-gray-900">{value}</dd>
    </div>
  );
}
