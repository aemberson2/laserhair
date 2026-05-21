import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import { JsonLd } from '@/components/JsonLd';
import { ProviderListFilters } from '@/components/ProviderListFilters';
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
  const topName = providers[0]?.name;

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
      a: topName
        ? `Based on aggregated ratings and review volume, ${topName} ranks at the top of our directory for ${city.name}, ${state.code}. We recommend comparing the top-rated providers below, checking recent reviews, and booking a consultation before committing to a package.`
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <JsonLd data={faqJsonLd} />

      <Breadcrumb
        baseUrl={getSiteUrl()}
        items={[
          { label: 'Home', href: '/' },
          { label: state.name, href: `/${state.slug}` },
          { label: city.name, href: `/${state.slug}/${city.slug}` },
        ]}
      />

      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Best Laser Hair Removal in {city.name}, {state.code}
        </h1>
        <p className="mt-3 text-gray-600">
          {providers.length.toLocaleString()}{' '}
          {providers.length === 1 ? 'provider' : 'providers'}
          {avg !== null && (
            <>
              {' · '}
              Average {avg.toFixed(1)} stars
            </>
          )}
          {providers.length > 0 && (
            <>
              {' · '}
              {bookingPct}% have online booking
            </>
          )}
        </p>
      </header>

      <section className="mt-8">
        <ProviderListFilters
          providers={providers}
          categories={categories}
          stateSlug={state.slug}
          citySlug={city.slug}
        />
      </section>

      <section className="mt-12 rounded-lg bg-white p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900">
          About Laser Hair Removal in {city.name}
        </h2>
        <p className="mt-3 text-gray-700">
          {city.name} has a growing market for laser hair removal, with{' '}
          {providers.length.toLocaleString()}{' '}
          {providers.length === 1 ? 'provider' : 'providers'} operating across med
          spas, dermatology offices, and dedicated laser clinics. Whether you&apos;re
          looking for a quick upper-lip treatment or a full-body package, comparing
          providers on equipment, technician credentials, and recent reviews is the
          best way to land on a clinic that fits your skin type and budget.
        </p>
        <p className="mt-3 text-gray-700">
          The most effective lasers for hair removal vary by skin tone — Alexandrite
          and Diode lasers work well for lighter skin, while Nd:YAG is generally
          preferred for darker skin tones. Most reputable clinics in {city.name}{' '}
          offer a free consultation and patch test, which is a good opportunity to
          confirm the provider uses appropriate equipment for your specific
          situation.
        </p>
        <p className="mt-3 text-gray-700">
          Pricing in {city.name}, {state.code} tends to track regional norms.
          Package deals for a full 6–8 session series almost always offer a
          meaningful per-session discount versus paying à la carte, so ask about
          package pricing during your consultation.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-gray-900">
          Frequently Asked Questions
        </h2>
        <div className="mt-4 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
          {faqs.map((faq) => (
            <details key={faq.q} className="group p-5">
              <summary className="flex cursor-pointer items-center justify-between text-base font-medium text-gray-900 marker:hidden">
                <span>{faq.q}</span>
                <span
                  aria-hidden="true"
                  className="ml-4 text-teal-600 transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-gray-700">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {nearbyCities.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900">
            Nearby Cities in {state.name}
          </h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {nearbyCities.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/${state.slug}/${c.slug}`}
                  className="inline-block rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:border-teal-600 hover:text-teal-700"
                >
                  {c.name}{' '}
                  <span className="text-gray-500">
                    ({c.provider_count.toLocaleString()})
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
