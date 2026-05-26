import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import {
  CheckBadgeIcon,
  ChevronRightIcon,
  PlusIcon,
  StarIcon,
} from '@/components/Icons';
import { JsonLd } from '@/components/JsonLd';
import { ProviderListFilters } from '@/components/ProviderListFilters';
import { QuoteButton } from '@/components/QuoteButton';
import { StickyMobileCTA } from '@/components/StickyMobileCTA';
import { getPostsForCity } from '@/lib/blog';
import {
  getAllCityParams,
  getCityPageData,
  getNeighborhoodsForCity,
  getTopCitiesNationwide,
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
  const cityBlogPosts = getPostsForCity(city.slug);
  const [neighborhoods, topCitiesAll] = await Promise.all([
    getNeighborhoodsForCity(city.slug),
    getTopCitiesNationwide(12),
  ]);
  const popularCitiesNationwide = topCitiesAll
    .filter((c) => c.city_slug !== city.slug)
    .slice(0, 10);

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

      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-center sm:rounded-2xl sm:border sm:border-teal-200 sm:bg-gradient-to-br sm:from-teal-50 sm:to-rose-50 sm:p-5">
        <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-rose-50 p-5 sm:border-0 sm:bg-none sm:p-0">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
            Not sure where to start?
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
            See pricing from multiple {city.name} providers
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Share what you&apos;d like treated and we&apos;ll send a short list of
            providers nearby with their pricing and availability.
          </p>
        </div>
        <QuoteButton
          variant="primary"
          label="Compare Quotes"
          city={city.name}
          stateCode={state.code}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 sm:whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        />
      </section>

      <section className="mt-8">
        <ProviderListFilters
          providers={providers}
          categories={categories}
          stateSlug={state.slug}
          citySlug={city.slug}
          cityName={city.name}
          stateCode={state.code}
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

      {neighborhoods.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Browse by Neighborhood
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Find laser hair removal providers near a specific area in {city.name}.
          </p>
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {neighborhoods.map((n) => (
              <li key={n.slug}>
                <Link
                  href={`/${state.slug}/${city.slug}/near/${n.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-900 group-hover:text-teal-700">
                      {n.name}
                    </p>
                    {n.avg_rating !== null && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                        <StarIcon className="h-3 w-3" />
                        {n.avg_rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {n.provider_count.toLocaleString()}{' '}
                    {n.provider_count === 1 ? 'provider' : 'providers'} nearby
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

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

      {cityBlogPosts.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Related Articles
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Research-backed guides relevant to laser hair removal in {city.name}.
          </p>
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cityBlogPosts.slice(0, 6).map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                    {post.topic}
                  </p>
                  <h3 className="mt-2 text-base font-semibold leading-snug text-slate-900 group-hover:text-teal-700">
                    {post.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                    {post.description}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-medium text-teal-700">
                    Read article
                    <ChevronRightIcon className="h-4 w-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

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

      {popularCitiesNationwide.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Popular Cities Nationwide
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Looking elsewhere? These are the most-searched cities in our directory.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {popularCitiesNationwide.map((c) => (
              <li key={`${c.state_code}-${c.city_slug}`}>
                <Link
                  href={`/${c.state_slug}/${c.city_slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition duration-150 hover:border-teal-300 hover:text-teal-700"
                >
                  {c.name}, {c.state_code}
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
