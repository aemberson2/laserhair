import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumb } from '@/components/Breadcrumb';
import { getAllStatesAlphabetical } from '@/lib/data';
import { getSiteUrl } from '@/lib/site';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Browse Laser Hair Removal by State',
  description:
    'Browse laser hair removal providers by state. View provider and city counts for every state we cover, then drill down to your area.',
};

export default async function StatesIndexPage() {
  const states = await getAllStatesAlphabetical();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumb
        baseUrl={getSiteUrl()}
        items={[
          { label: 'Home', href: '/' },
          { label: 'Browse by State', href: '/states' },
        ]}
      />

      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Browse Laser Hair Removal by State
        </h1>
        <p className="mt-3 text-gray-600">
          {states.length > 0
            ? `Find laser hair removal providers across ${states.length} states.`
            : 'Find laser hair removal providers across the United States.'}{' '}
          Pick a state to see all cities we cover and the top-rated providers nearby.
        </p>
      </header>

      {states.length > 0 ? (
        <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {states.map((state) => (
            <li key={state.slug}>
              <Link
                href={`/${state.slug}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-teal-600 hover:shadow-sm"
              >
                <p className="font-medium text-gray-900">{state.name}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {state.provider_count.toLocaleString()}{' '}
                  {state.provider_count === 1 ? 'provider' : 'providers'}
                  {' · '}
                  {state.city_count.toLocaleString()}{' '}
                  {state.city_count === 1 ? 'city' : 'cities'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          State data isn&apos;t available yet. Please check back soon.
        </p>
      )}
    </div>
  );
}
