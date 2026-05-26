import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/Breadcrumb';
import { getHomeData } from '@/lib/data';
import { getSiteUrl } from '@/lib/site';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'About LaserHairNearMe.com',
  description:
    'LaserHairNearMe.com is a free directory helping you find and compare laser hair removal providers across the United States.',
};

const FALLBACK_PROVIDERS = '2,715+';
const FALLBACK_CITIES = '301';

export default async function AboutPage() {
  const { totalProviders, totalCities } = await getHomeData();
  const providerCountStr =
    totalProviders > 0 ? `${totalProviders.toLocaleString()}+` : FALLBACK_PROVIDERS;
  const cityCountStr =
    totalCities > 0 ? totalCities.toLocaleString() : FALLBACK_CITIES;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumb
        baseUrl={getSiteUrl()}
        items={[
          { label: 'Home', href: '/' },
          { label: 'About', href: '/about' },
        ]}
      />

      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          About LaserHairNearMe.com
        </h1>
        <p className="mt-4 text-lg text-gray-700">
          LaserHairNearMe.com is a free directory helping you find and compare
          laser hair removal providers across the United States.
        </p>
      </header>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">What we offer</h2>
        <p className="mt-3 text-gray-700">
          We currently list {providerCountStr} laser hair removal providers across{' '}
          {cityCountStr} cities. For every provider you&apos;ll find:
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-6 text-gray-700">
          <li>Aggregated ratings and review counts</li>
          <li>Phone number, website, and full address</li>
          <li>Hours of operation and current open/closed status</li>
          <li>Direct booking links where the provider offers online scheduling</li>
          <li>
            Categories, amenities, and accessibility details parsed from public
            business profiles
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">How we collect data</h2>
        <p className="mt-3 text-gray-700">
          Our listings are aggregated from public sources, including verified
          business listings. We filter out non-operational businesses and prioritize
          providers that explicitly offer laser hair removal services. Data is
          refreshed periodically to keep ratings, hours, and contact information
          current.
        </p>
        <p className="mt-3 text-gray-700">
          We do not accept payment from providers in exchange for higher rankings.
          Top-rated lists are ordered purely by aggregated rating and review volume.
        </p>
      </section>

      <section className="mt-10 rounded-lg border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-base font-semibold text-amber-900">Disclaimer</h2>
        <p className="mt-2 text-sm text-amber-900">
          LaserHairNearMe.com is a directory, not a medical provider. We do not
          deliver laser hair removal services, employ technicians, or endorse any
          specific clinic. Listings are informational only. Always consult with a
          licensed professional before beginning any cosmetic or medical procedure,
          and verify a provider&apos;s credentials and current operating status
          directly with the business before booking.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">Contact</h2>
        <p className="mt-3 text-gray-700">
          Spot an error in a listing, want a provider added or removed, or have
          general feedback? Email us at{' '}
          <a
            href="mailto:hello@laserhairnearme.com"
            className="text-teal-700 hover:underline"
          >
            hello@laserhairnearme.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
