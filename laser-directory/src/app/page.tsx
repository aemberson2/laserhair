import type { Metadata } from 'next';
import Link from 'next/link';
import { CitySearchBox } from '@/components/CitySearchBox';
import { CheckBadgeIcon, PlusIcon, StarIcon } from '@/components/Icons';
import { JsonLd } from '@/components/JsonLd';
import { getAllCitiesForSearch, getHomeData } from '@/lib/data';

export const revalidate = 3600;

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How does laser hair removal work?',
    a: 'A laser emits concentrated light that is absorbed by the pigment (melanin) in the hair. The heat damages the hair follicle enough to slow or stop future growth. Most people need 6 to 8 sessions spaced 4 to 8 weeks apart to target hair in its active growth phase.',
  },
  {
    q: 'Is laser hair removal permanent?',
    a: 'Laser hair removal produces long-lasting reduction in hair growth, but is more accurately described as "permanent reduction" than "permanent removal." Most clients see 70 to 90 percent fewer hairs after a full series, with occasional maintenance sessions every 6 to 12 months.',
  },
  {
    q: 'How much does laser hair removal cost?',
    a: 'Prices vary by treatment area and location. Small areas like the upper lip typically cost $75 to $200 per session, while larger areas like the legs or back can range from $300 to $800 per session. Package deals for a full series are common and usually offer the best per-session price.',
  },
  {
    q: 'Does laser hair removal hurt?',
    a: 'Most people describe the sensation as a rubber band snap against the skin. Modern lasers include built-in cooling to reduce discomfort, and many providers offer topical numbing cream for sensitive areas. Discomfort is brief and tolerable for the vast majority of clients.',
  },
  {
    q: 'How do I choose a laser hair removal provider?',
    a: 'Look for licensed providers using FDA-cleared equipment, with strong reviews and clear pre- and post-care guidance. Ask about the specific laser technology they use (different lasers work better for different skin tones), and request a consultation and patch test before committing to a package.',
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const { totalProviders, totalCities } = await getHomeData();
  const providers = totalProviders.toLocaleString();
  const cities = totalCities.toLocaleString();
  return {
    title: { absolute: 'Find Laser Hair Removal Near You | LaserHairNearMe' },
    description: `Compare ${providers} laser hair removal providers across ${cities} cities. View ratings, read reviews, and book appointments near you.`,
  };
}

export default async function Home() {
  const [{ totalProviders, totalCities, topStates, topCities }, searchCities] =
    await Promise.all([getHomeData(), getAllCitiesForSearch()]);

  const providersStr = totalProviders > 0 ? totalProviders.toLocaleString() : '2,200+';
  const citiesStr = totalCities > 0 ? totalCities.toLocaleString() : '300+';

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  return (
    <>
      <JsonLd data={faqJsonLd} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-rose-50 via-white to-teal-50">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-32 h-64 bg-gradient-to-b from-teal-100/50 to-transparent blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-12 text-center sm:py-20">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/70 px-3 py-1 text-xs font-medium text-teal-700 shadow-sm backdrop-blur">
            <CheckBadgeIcon className="h-3.5 w-3.5" />
            Trusted by {providersStr} providers nationwide
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:mt-5 sm:text-5xl md:text-6xl">
            Find Laser Hair Removal
            <span className="block text-teal-700">Near You</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 sm:mt-5 sm:text-lg">
            Compare {providersStr} providers across {citiesStr} cities. Real ratings,
            real reviews, real bookings — all in one place.
          </p>

          <CitySearchBox cities={searchCities} />

          <p className="mt-4 text-xs text-slate-500">
            Free to use · No login required · Updated weekly
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        {topStates.length > 0 && (
          <section>
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Top States</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Browse providers by the states with the most listings.
                </p>
              </div>
              <Link
                href="/states"
                className="hidden text-sm font-medium text-teal-700 transition hover:text-teal-800 sm:inline"
              >
                See all states &rarr;
              </Link>
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {topStates.map((state) => (
                <li key={state.slug}>
                  <Link
                    href={`/${state.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-150 ease-out hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
                  >
                    <p className="font-semibold text-slate-900 group-hover:text-teal-700">
                      {state.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {state.provider_count.toLocaleString()} providers
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {topCities.length > 0 && (
          <section className="mt-14">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Top Cities</h2>
            <p className="mt-1 text-sm text-slate-600">
              The most-searched metro areas in our directory.
            </p>
            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topCities.map((city) => (
                <li key={`${city.state_code}-${city.slug}`}>
                  <Link
                    href={`/${city.state_slug}/${city.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-150 ease-out hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-base font-semibold text-slate-900 group-hover:text-teal-700">
                        {city.name}
                        <span className="ml-1.5 text-sm font-normal text-slate-500">
                          {city.state_code}
                        </span>
                      </p>
                      {city.avg_rating !== null && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                          <StarIcon className="h-3 w-3" />
                          {city.avg_rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {city.provider_count.toLocaleString()} providers
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* About */}
        <section className="mt-16 grid grid-cols-1 gap-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10 lg:grid-cols-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">About Laser Hair Removal</h2>
            <p className="mt-2 text-sm text-slate-600">
              What to know before you book your first session.
            </p>
          </div>
          <div className="space-y-3 text-slate-700 lg:col-span-2">
            <p>
              Laser hair removal is a popular, FDA-cleared cosmetic procedure that uses
              concentrated light to reduce unwanted hair on the face, legs, underarms,
              bikini area, back, and other parts of the body. A series of sessions
              gradually disables hair follicles in the active growth phase, producing
              smoother skin and long-lasting reduction in hair growth.
            </p>
            <p>
              Choosing the right provider matters — equipment, technician training, and
              pre- and post-care all influence both safety and results. This directory
              compiles operating providers across the United States with ratings,
              reviews, and contact details to help you compare options and book a
              consultation nearby.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-14">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Quick answers to the questions we hear most often.
            </p>
          </div>
          <div className="mx-auto mt-6 max-w-3xl divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {FAQS.map((faq) => (
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
      </div>
    </>
  );
}
