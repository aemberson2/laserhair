import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ChevronRightIcon, MapPinIcon, PlusIcon, StarIcon } from '@/components/Icons';
import { JsonLd } from '@/components/JsonLd';
import { ProviderListFilters } from '@/components/ProviderListFilters';
import { QuoteButton } from '@/components/QuoteButton';
import {
  getAllNeighborhoodParams,
  getNeighborhoodPageData,
  type NeighborhoodPageData,
} from '@/lib/data';
import { getSiteUrl } from '@/lib/site';

export const revalidate = 3600;

type Params = { stateSlug: string; citySlug: string; neighborhoodSlug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return await getAllNeighborhoodParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { stateSlug, citySlug, neighborhoodSlug } = await params;
  const data = await getNeighborhoodPageData(stateSlug, citySlug, neighborhoodSlug);
  if (!data) return { title: 'Neighborhood not found' };
  const { neighborhood, providers } = data;
  const avg = avgRating(providers);
  const avgStr = avg !== null ? avg.toFixed(1) : 'N/A';
  return {
    title: `Laser Hair Removal Near ${neighborhood.name}, ${neighborhood.city} — ${providers.length} Providers`,
    description: `Find ${providers.length} laser hair removal providers near ${neighborhood.name}, ${neighborhood.city}. Average rating ${avgStr}. Sorted by distance, with hours, contact info, and booking links.`,
  };
}

function avgRating(providers: NeighborhoodPageData['providers']): number | null {
  const rated = providers.map((p) => p.rating).filter((r): r is number => r !== null);
  if (rated.length === 0) return null;
  return rated.reduce((s, r) => s + r, 0) / rated.length;
}

function topCategories(providers: NeighborhoodPageData['providers'], n = 8): string[] {
  const counts = new Map<string, number>();
  for (const p of providers) {
    for (const sub of p.subtypes ?? []) counts.set(sub, (counts.get(sub) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([cat]) => cat);
}

export default async function NeighborhoodPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { stateSlug, citySlug, neighborhoodSlug } = await params;
  const data = await getNeighborhoodPageData(stateSlug, citySlug, neighborhoodSlug);
  if (!data) notFound();

  const { neighborhood: n, providers, siblings } = data;
  const avg = avgRating(providers);
  const top = providers[0];
  const categories = topCategories(providers);

  const faqs: { q: string; a: string }[] = [
    {
      q: `How much does laser hair removal cost near ${n.name}?`,
      a: `Prices near ${n.name}, ${n.city} run about $75–$200 for small areas like the upper lip and $200–$400 for a Brazilian. Most clinics in ${n.city} sell packages of six sessions at a meaningful per-session discount over single visits.`,
    },
    {
      q: `What's the best laser hair removal clinic near ${n.name}?`,
      a: top
        ? `Based on aggregated ratings and review volume, ${top.name} ranks at the top of providers within walking or short-driving distance of ${n.name}. Compare the listings below by distance, rating, and category to find the right fit for you.`
        : `We don't have enough provider data near ${n.name} yet to highlight a specific clinic. Try expanding your search to all of ${n.city}.`,
    },
  ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <JsonLd data={faqJsonLd} />

      <Breadcrumb
        baseUrl={getSiteUrl()}
        items={[
          { label: 'Home', href: '/' },
          { label: n.state_code, href: `/${n.state_slug}` },
          { label: n.city, href: `/${n.state_slug}/${n.city_slug}` },
          {
            label: `Near ${n.name}`,
            href: `/${n.state_slug}/${n.city_slug}/near/${n.slug}`,
          },
        ]}
      />

      <header className="mt-5">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Laser Hair Removal Near {n.name}, {n.city}
        </h1>
        <p className="mt-2 text-slate-600">
          Providers sorted by distance from {n.name}. Treatment radius about{' '}
          {(n.radius_km * 0.621371).toFixed(1)} miles.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 font-medium text-teal-700 ring-1 ring-inset ring-teal-200">
            <MapPinIcon className="h-3.5 w-3.5" />
            {providers.length.toLocaleString()}{' '}
            {providers.length === 1 ? 'provider' : 'providers'}
          </span>
          {avg !== null && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
              <StarIcon className="h-3.5 w-3.5" />
              {avg.toFixed(1)} avg
            </span>
          )}
          <Link
            href={`/${n.state_slug}/${n.city_slug}`}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
          >
            <span aria-hidden="true">&larr;</span>
            See all of {n.city}
          </Link>
        </div>
      </header>

      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-center sm:rounded-2xl sm:border sm:border-teal-200 sm:bg-gradient-to-br sm:from-teal-50 sm:to-rose-50 sm:p-5">
        <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-rose-50 p-5 sm:border-0 sm:bg-none sm:p-0">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
            Get matched
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
            Connect with top-rated providers near {n.name}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Tell us what you&apos;re looking for and we&apos;ll match you with vetted clinics.
            Free, no obligation.
          </p>
        </div>
        <QuoteButton
          variant="primary"
          label="Get a Free Quote"
          city={n.city}
          stateCode={n.state_code}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 sm:whitespace-nowrap"
        />
      </section>

      <section className="mt-8">
        <ProviderListFilters
          providers={providers}
          categories={categories}
          stateSlug={n.state_slug}
          citySlug={n.city_slug}
          cityName={n.city}
          stateCode={n.state_code}
        />
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Frequently Asked Questions
        </h2>
        <div className="mx-auto mt-6 max-w-3xl divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {faqs.map((faq) => (
            <details key={faq.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 transition hover:bg-slate-50">
                <span className="text-base font-medium text-slate-900">{faq.q}</span>
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700 transition duration-150 group-open:rotate-45"
                >
                  <PlusIcon className="h-4 w-4" />
                </span>
              </summary>
              <p className="px-6 pb-5 text-sm leading-relaxed text-slate-600">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {siblings.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Other Neighborhoods in {n.city}
          </h2>
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {siblings.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/${n.state_slug}/${n.city_slug}/near/${s.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
                >
                  <p className="font-semibold text-slate-900 group-hover:text-teal-700">
                    {s.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {s.provider_count.toLocaleString()}{' '}
                    {s.provider_count === 1 ? 'provider' : 'providers'} nearby
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-700">
                    See providers
                    <ChevronRightIcon className="h-4 w-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
