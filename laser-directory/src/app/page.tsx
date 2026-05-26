import type { Metadata } from 'next';
import Link from 'next/link';
import { CitySearchBox } from '@/components/CitySearchBox';
import { JsonLd } from '@/components/JsonLd';
import { StarRating } from '@/components/StarRating';
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
    title: { absolute: 'Find Laser Hair Removal Near You | Laser Directory' },
    description: `Compare ${providers} laser hair removal providers across ${cities} cities. View ratings, read reviews, and book appointments near you.`,
  };
}

export default async function Home() {
  const [{ totalProviders, totalCities, topStates, topCities }, searchCities] =
    await Promise.all([getHomeData(), getAllCitiesForSearch()]);

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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <JsonLd data={faqJsonLd} />

      <section className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Find Laser Hair Removal Near You
        </h1>
        <p className="mt-4 text-base text-gray-600 sm:text-lg">
          Compare {totalProviders.toLocaleString()} providers across{' '}
          {totalCities.toLocaleString()} cities
        </p>

        <CitySearchBox cities={searchCities} />
      </section>

      {topStates.length > 0 && (
        <section className="mt-16">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">Top States</h2>
            <Link href="/states" className="text-sm text-teal-600 hover:underline">
              See all states &rarr;
            </Link>
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {topStates.map((state) => (
              <li key={state.slug}>
                <Link
                  href={`/${state.slug}`}
                  className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-teal-600 hover:shadow-sm"
                >
                  <p className="font-medium text-gray-900">{state.name}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {state.provider_count.toLocaleString()} providers
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {topCities.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900">Top Cities</h2>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topCities.map((city) => (
              <li key={`${city.state_code}-${city.slug}`}>
                <Link
                  href={`/${city.state_slug}/${city.slug}`}
                  className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-teal-600 hover:shadow-sm"
                >
                  <p className="font-medium text-gray-900">
                    {city.name}, {city.state_code}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {city.provider_count.toLocaleString()} providers
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

      <section className="mt-16 rounded-lg bg-white p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900">
          About Laser Hair Removal
        </h2>
        <p className="mt-3 text-gray-700">
          Laser hair removal is a popular, FDA-cleared cosmetic procedure that uses
          concentrated light to reduce unwanted hair on the face, legs, underarms,
          bikini area, back, and other parts of the body. A series of sessions
          gradually disables hair follicles in the active growth phase, producing
          smoother skin and long-lasting reduction in hair growth. Choosing the
          right provider matters — equipment, technician training, and pre- and
          post-care all influence both safety and results.
        </p>
        <p className="mt-3 text-gray-700">
          This directory compiles operating laser hair removal providers across the
          United States, with ratings, reviews, and contact details to help you
          compare options and book a consultation near you.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-gray-900">
          Frequently Asked Questions
        </h2>
        <div className="mt-4 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
          {FAQS.map((faq) => (
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
    </div>
  );
}
