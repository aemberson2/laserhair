import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import { JsonLd } from '@/components/JsonLd';
import { ProviderCard } from '@/components/ProviderCard';
import { StarRating } from '@/components/StarRating';
import {
  getAllProviderParams,
  getProviderPageData,
  type ProviderFull,
} from '@/lib/data';
import {
  currentDayInTimezone,
  isOpenNow,
  parseWorkingHours,
} from '@/lib/hours';

export const revalidate = 3600;

type Params = { stateSlug: string; citySlug: string; providerSlug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return await getAllProviderParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { stateSlug, citySlug, providerSlug } = await params;
  const data = await getProviderPageData(stateSlug, citySlug, providerSlug);
  if (!data) return { title: 'Provider not found' };
  const { state, city, provider } = data;
  const rating = provider.rating !== null ? provider.rating.toFixed(1) : 'N/A';
  const count = provider.review_count ?? 0;
  const category = provider.category ?? 'Laser hair removal';
  return {
    title: `${provider.name} — Laser Hair Removal in ${city.name}, ${state.code}`,
    description: `${provider.name} in ${city.name}, ${state.code}. Rated ${rating}/5 from ${count.toLocaleString()} reviews. ${category}. View hours, contact info, and book an appointment.`,
  };
}

const PHOTO_PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 240'><rect width='400' height='240' fill='%23f3f4f6'/><path d='M150 170c0-25 22-44 50-44s50 19 50 44M200 116a26 26 0 100-52 26 26 0 000 52z' fill='%239ca3af'/></svg>";

export default async function ProviderPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { stateSlug, citySlug, providerSlug } = await params;
  const data = await getProviderPageData(stateSlug, citySlug, providerSlug);
  if (!data) notFound();

  const { state, city, provider, nearby } = data;
  const hours = parseWorkingHours(provider.working_hours);
  const today = currentDayInTimezone(provider.timezone);
  const todayHours = hours.find((h) => h.day === today)?.text ?? null;
  const openState = isOpenNow(todayHours, provider.timezone);
  const aboutGroups = parseAbout(provider.about);
  const localBusinessJsonLd = buildLocalBusinessJsonLd(provider);
  const phoneDigits = provider.phone?.replace(/[^\d+]/g, '') ?? '';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <JsonLd data={localBusinessJsonLd} />

      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: state.name, href: `/${state.slug}` },
          { label: city.name, href: `/${state.slug}/${city.slug}` },
          {
            label: provider.name,
            href: `/${state.slug}/${city.slug}/${provider.slug}`,
          },
        ]}
      />

      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {provider.name}
        </h1>
        <p className="mt-2 text-gray-600">
          Laser Hair Removal in {city.name}, {state.code}
        </p>
      </header>

      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={provider.photo_url ?? PHOTO_PLACEHOLDER}
            alt={`${provider.name} photo`}
            className="aspect-[5/3] w-full rounded-lg object-cover"
          />
        </div>
        <aside className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-center gap-2">
            {provider.is_laser_specialist && (
              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800">
                Laser Specialist
              </span>
            )}
            {provider.is_verified && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                Verified
              </span>
            )}
            {openState === 'open' && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                Open now
              </span>
            )}
            {openState === 'closed' && (
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                Closed now
              </span>
            )}
          </div>

          <div className="mt-3">
            <StarRating
              rating={provider.rating}
              reviewCount={provider.review_count}
            />
          </div>

          <div className="mt-5 flex flex-col gap-2">
            {provider.booking_url && (
              <a
                href={provider.booking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-teal-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-teal-700"
              >
                Book Appointment
              </a>
            )}
            {phoneDigits && (
              <a
                href={`tel:${phoneDigits}`}
                className="rounded-md border border-teal-600 px-4 py-2.5 text-center text-sm font-medium text-teal-700 hover:bg-teal-50"
              >
                Call Now
              </a>
            )}
            {provider.website && (
              <a
                href={provider.website}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-gray-300 px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:border-gray-400"
              >
                Visit Website
              </a>
            )}
          </div>
        </aside>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {provider.phone && (
              <Row label="Phone">
                <a
                  href={`tel:${phoneDigits}`}
                  className="text-teal-700 hover:underline"
                >
                  {provider.phone}
                </a>
              </Row>
            )}
            {provider.website && (
              <Row label="Website">
                <a
                  href={provider.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-700 hover:underline"
                >
                  {provider.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              </Row>
            )}
            {provider.address && <Row label="Address">{provider.address}</Row>}
            {provider.google_maps_url && (
              <Row label="Map">
                <a
                  href={provider.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-700 hover:underline"
                >
                  Open in Google Maps
                </a>
              </Row>
            )}
          </dl>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900">Hours</h2>
          {hours.some((h) => h.text) ? (
            <table className="mt-3 w-full text-sm">
              <tbody>
                {hours.map((h) => {
                  const isToday = h.day === today;
                  return (
                    <tr key={h.day} className={isToday ? 'font-medium' : ''}>
                      <td className="py-1 pr-4 text-gray-700">{h.day}</td>
                      <td className="py-1 text-gray-900">{h.text || 'Closed'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="mt-3 text-sm text-gray-500">Hours not available.</p>
          )}
        </div>
      </section>

      {aboutGroups.length > 0 && (
        <section className="mt-10 rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900">About</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {aboutGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-medium text-gray-900">{group.title}</h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span
                        aria-hidden="true"
                        className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {(provider.review_count ?? 0) > 0 && (
        <section className="mt-10 rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900">Review Breakdown</h2>
          <ReviewBreakdown provider={provider} />
        </section>
      )}

      {nearby.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900">
            Nearby Providers in {city.name}
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {nearby.map((p) => (
              <li key={p.slug}>
                <ProviderCard
                  provider={p}
                  href={`/${state.slug}/${city.slug}/${p.slug}`}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 text-gray-500">{label}</dt>
      <dd className="text-gray-900">{children}</dd>
    </div>
  );
}

type AboutGroup = { title: string; items: string[] };

function parseAbout(raw: unknown): AboutGroup[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  const groups: AboutGroup[] = [];
  for (const [title, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const items: string[] = [];
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === true) items.push(k);
      else if (typeof v === 'string' && v.trim().length > 0) items.push(`${k}: ${v}`);
    }
    if (items.length > 0) groups.push({ title, items });
  }
  return groups;
}

function ReviewBreakdown({ provider }: { provider: ProviderFull }) {
  const buckets: { stars: number; count: number }[] = [
    { stars: 5, count: provider.reviews_5 ?? 0 },
    { stars: 4, count: provider.reviews_4 ?? 0 },
    { stars: 3, count: provider.reviews_3 ?? 0 },
    { stars: 2, count: provider.reviews_2 ?? 0 },
    { stars: 1, count: provider.reviews_1 ?? 0 },
  ];
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const total = buckets.reduce((s, b) => s + b.count, 0);

  return (
    <div className="mt-3 space-y-2">
      {buckets.map(({ stars, count }) => {
        const widthPct = (count / max) * 100;
        const sharePct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={stars} className="flex items-center gap-3 text-sm">
            <span className="w-8 text-right text-gray-700">{stars}★</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <span className="w-20 text-right tabular-nums text-gray-700">
              {count.toLocaleString()} ({sharePct}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

function buildLocalBusinessJsonLd(provider: ProviderFull) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: provider.name,
  };
  if (provider.photo_url) jsonLd.image = provider.photo_url;
  if (provider.phone) jsonLd.telephone = provider.phone;
  if (provider.website) jsonLd.url = provider.website;

  const address: Record<string, string> = { '@type': 'PostalAddress' };
  if (provider.street) address.streetAddress = provider.street;
  if (provider.city) address.addressLocality = provider.city;
  if (provider.state) address.addressRegion = provider.state;
  if (provider.postal_code) address.postalCode = provider.postal_code;
  address.addressCountry = 'US';
  jsonLd.address = address;

  if (provider.latitude !== null && provider.longitude !== null) {
    jsonLd.geo = {
      '@type': 'GeoCoordinates',
      latitude: provider.latitude,
      longitude: provider.longitude,
    };
  }

  if (
    provider.rating !== null &&
    provider.review_count !== null &&
    provider.review_count > 0
  ) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: provider.rating,
      reviewCount: provider.review_count,
    };
  }

  return jsonLd;
}
