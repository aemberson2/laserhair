import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import {
  CheckBadgeIcon,
  PlusIcon,
  StarIcon,
} from '@/components/Icons';
import { JsonLd } from '@/components/JsonLd';
import { ProviderListFilters } from '@/components/ProviderListFilters';
import { StickyMobileCTA } from '@/components/StickyMobileCTA';
import {
  getAllCityParams,
  getCityPageData,
  type CityPageData,
} from '@/lib/data';
import { getSiteUrl } from '@/lib/site';

export const revalidate = 3600;

type Params = { stateSlug: string; citySlug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return await getAllCityParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { stateSlug, citySlug } = await params;
  const data = await getCityPageData(stateSlug, citySlug);
  if (!data) return { title: 'City not found' };
  const { state, city, providers } = data;
  const count = providers.length;
  const avg = avgRating(providers);
  const avgStr = avg !== null ? avg.toFixed(1) : 'N/A';
  return {
    title: `Best Laser Hair Removal in ${city.name}, ${state.code} — ${count} Providers`,
    description: `Compare ${count} laser hair removal providers in ${city.name}, ${state.code}. Average rating ${avgStr}. View ratings, hours, and book appointments.`,
  };
}

function avgRating(providers: CityPageData['providers']): number | null {
  const rated = providers.map((p) => p.rating).filter((r): r is number => r !== null);
  if (rated.length === 0) return null;
  return rated.reduce((s, r) => s + r, 0) / rated.length;
}

function topCategories(providers: CityPageData['providers'], n = 8): string[] {
  const counts = new Map<string, number>();
  for (const p of providers) {
    for (const sub of p.subtypes ?? []) {
      counts.set(sub, (counts.get(sub) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([cat]) => cat);
}

export default async function CityPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { stateSlug, citySlug } = await params;
  const data = await getCityPageData(stateSlug, citySlug);
  if (!data) notFound();

  const { state, city, providers, nearbyCities } = data;
  const avg = avgRating(providers);
  const withBooking = providers.filter((p) => !!p.booking_url).length;
  const bookingPct =
    providers.length > 0 ? Math.round((withBooking / providers.length) * 100) : 0;
  const categories = topCategories(providers);
  const top = providers[0];

  const faqs: { q: string; a: string }[] = [
    {
      q: `How much does laser hair removal cost in ${city.name}?`,
      a: `Prices in ${city.name}, ${state.code} vary by treatment area and provider. Small areas like the upper lip typically run $75–$200 per session, while larger areas like the legs or back range from $300–$800 per session. Most clinics in ${city.name} offer package deals for a full series of 6–8 sessions that bring the per-session price down.`,
    },
    {
      q: 'How many sessions do you need for laser hair removal?',
      a: 'Most people need 6 to 8 sessions spaced 4 to 8 weeks apart to see lasting results, since the laser only affects hair currently in the active growth phase. Some clients add 1–2 maintenance sessions per year afterward to address regrowth.',
    },
    {
      q: `What's the best laser hair removal clinic in ${city.name}?`,
      a: top
        ? `Based on aggregated ratings and review volume, ${top.name} ranks at the top of our directory for ${city.name}, ${state.code}. We recommend comparing the top-rated providers below, checking recent reviews, and booking a consultation before committing to a package.`
        : `We don't have enough provider data for ${city.name} yet to highlight a specific clinic. Check the listings below and read recent reviews to find the right fit.`,
    },
    {
      q: 'Does laser hair removal hurt?',
      a: 'Most clients describe the sensation as a rubber band snap against the skin. Modern lasers include built-in cooling to reduce discomfort, and many providers offer a topical numbing cream for sensitive areas like the bikini line or face.',
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
    <div className="mx-auto max-w-6xl px-4 py-8 pb-28 sm:py-10 lg:pb-10">
      <JsonLd data={faqJsonLd} />

      <Breadcrumb
        baseUrl={getSiteUrl()}
        items={[
          { label: 'Home', href: '/' },
          { label: state.name, href: `/${state.slug}` },
          { label: city.name, href: `/${state.slug}/${city.slug}` },
        ]}
      />

      <header className="mt-5">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Best Laser Hair Removal in {city.name}, {state.code}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 font-medium text-teal-700 ring-1 ring-inset ring-teal-200">
            {providers.length.toLocaleString()}{' '}
            {providers.length === 1 ? 'provider' : 'providers'}
          </span>
          {avg !== null && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
              <StarIcon className="h-3.5 w-3.5" />
              {avg.toFixed(1)} avg
            </span>
          )}
          {providers.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <CheckBadgeIcon className="h-3.5 w-3.5" />
              {bookingPct}% online booking
            </span>
          )}
        </div>
      </header>

      <section className="mt-8">
        <ProviderListFilters
          providers={providers}
          categories={categories}
          stateSlug={state.slug}
          citySlug={city.slug}
        />
      </section>

      <section className="mt-14 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-bold text-slate-900">
          About Laser Hair Removal in {city.name}
        </h2>
        <div className="mt-3 space-y-3 text-slate-700">
          <p>
            {city.name} has a growing market for laser hair removal, with{' '}
            {providers.length.toLocaleString()}{' '}
            {providers.length === 1 ? 'provider' : 'providers'} operating across med
            spas, dermatology offices, and dedicated laser clinics. Whether you&apos;re
            looking for a quick upper-lip treatment or a full-body package, comparing
            providers on equipment, technician credentials, and recent reviews is the
            best way to land on a clinic that fits your skin type and budget.
          </p>
          <p>
            The most effective lasers for hair removal vary by skin tone — Alexandrite
            and Diode lasers work well for lighter skin, while Nd:YAG is generally
            preferred for darker skin tones. Most reputable clinics in {city.name}{' '}
            offer a free consultation and patch test, which is a good opportunity to
            confirm the provider uses appropriate equipment for your specific
            situation.
          </p>
          <p>
            Pricing in {city.name}, {state.code} tends to track regional norms.
            Package deals for a full 6–8 session series almost always offer a
            meaningful per-session discount versus paying à la carte, so ask about
            package pricing during your consultation.
          </p>
        </div>
      </section>

      <section className="mt-14">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Frequently Asked Questions
          </h2>
        </div>
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

      {nearbyCities.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Nearby Cities in {state.name}
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {nearbyCities.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/${state.slug}/${c.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition duration-150 hover:border-teal-300 hover:text-teal-700"
                >
                  {c.name}
                  <span className="text-slate-400">
                    {c.provider_count.toLocaleString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {top && (
        <StickyMobileCTA
          name={top.name}
          rating={top.rating}
          bookingUrl={top.booking_url}
          phone={top.phone}
          href={`/${state.slug}/${city.slug}/${top.slug}`}
        />
      )}
    </div>
  );
}
