import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import {
  CheckBadgeIcon,
  ClockIcon,
  GlobeIcon,
  MapPinIcon,
  PhoneIcon,
  SparklesIcon,
  StarIcon,
} from '@/components/Icons';
import { ClaimListingButton } from '@/components/ClaimListingButton';
import { JsonLd } from '@/components/JsonLd';
import { ProviderCard } from '@/components/ProviderCard';
import { QuoteButton } from '@/components/QuoteButton';
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
import { getSiteUrl } from '@/lib/site';

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

function initials(name: string): string {
  const words = name
    .replace(/[^a-zA-Z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

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
  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/${state.slug}/${city.slug}/${provider.slug}`;
  const localBusinessJsonLd = buildLocalBusinessJsonLd(provider, canonicalUrl);
  const phoneDigits = provider.phone?.replace(/[^\d+]/g, '') ?? '';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <JsonLd data={localBusinessJsonLd} />

      <Breadcrumb
        baseUrl={siteUrl}
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

      <header className="mt-5">
        <div className="flex flex-wrap items-center gap-1.5">
          {provider.is_laser_specialist && (
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700 ring-1 ring-inset ring-teal-200">
              <SparklesIcon className="h-3 w-3" />
              Laser Specialist
            </span>
          )}
          {provider.is_verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <CheckBadgeIcon className="h-3 w-3" />
              Verified
            </span>
          )}
          {openState === 'open' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Open now
            </span>
          )}
          {openState === 'closed' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Closed now
            </span>
          )}
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {provider.name}
        </h1>
        <p className="mt-2 text-slate-600">
          Laser Hair Removal in {city.name}, {state.code}
        </p>
        <Link
          href={`/${state.slug}/${city.slug}`}
          className="mt-3 inline-flex items-center text-sm font-medium text-teal-700 transition hover:text-teal-800"
        >
          <span aria-hidden="true" className="mr-1">&larr;</span>
          Back to {city.name}
        </Link>
      </header>

      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 to-rose-50 shadow-sm lg:col-span-2">
          {provider.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={provider.photo_url}
              alt={`${provider.name} photo`}
              className="aspect-[5/3] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[5/3] w-full items-center justify-center text-6xl font-semibold text-teal-700">
              {initials(provider.name)}
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <StarRating
            rating={provider.rating}
            reviewCount={provider.review_count}
            size="md"
          />

          <div className="flex flex-col gap-2">
            <QuoteButton
              variant="primary"
              label="Get a Free Quote"
              providerName={provider.name}
              providerSlug={provider.slug}
              city={city.name}
              stateCode={state.code}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
            />
            {provider.booking_url && (
              <a
                href={provider.booking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-600 px-4 py-3 text-sm font-semibold text-teal-700 transition duration-150 hover:bg-teal-50"
              >
                Book Appointment
              </a>
            )}
            {phoneDigits && (
              <a
                href={`tel:${phoneDigits}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition duration-150 hover:border-slate-400 hover:bg-slate-50"
              >
                <PhoneIcon className="h-4 w-4" />
                Call Now
              </a>
            )}
            {provider.website && (
              <a
                href={provider.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition duration-150 hover:border-slate-400 hover:bg-slate-50"
              >
                <GlobeIcon className="h-4 w-4" />
                Visit Website
              </a>
            )}
          </div>
        </aside>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Contact</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {provider.phone && (
              <ContactRow icon={<PhoneIcon className="h-4 w-4" />}>
                <a
                  href={`tel:${phoneDigits}`}
                  className="font-medium text-teal-700 transition hover:text-teal-800"
                >
                  {provider.phone}
                </a>
              </ContactRow>
            )}
            {provider.website && (
              <ContactRow icon={<GlobeIcon className="h-4 w-4" />}>
                <a
                  href={provider.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all font-medium text-teal-700 transition hover:text-teal-800"
                >
                  {provider.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              </ContactRow>
            )}
            {provider.address && (
              <ContactRow icon={<MapPinIcon className="h-4 w-4" />}>
                <span className="text-slate-700">{provider.address}</span>
              </ContactRow>
            )}
            {provider.google_maps_url && (
              <ContactRow icon={<MapPinIcon className="h-4 w-4" />}>
                <a
                  href={provider.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-teal-700 transition hover:text-teal-800"
                >
                  Open in Google Maps
                </a>
              </ContactRow>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Hours</h2>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <ClockIcon className="h-3.5 w-3.5" />
              {provider.timezone ?? 'Local time'}
            </span>
          </div>
          {hours.some((h) => h.text) ? (
            <table className="mt-4 w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {hours.map((h) => {
                  const isToday = h.day === today;
                  const isClosed = !h.text || /^closed$/i.test(h.text);
                  return (
                    <tr
                      key={h.day}
                      className={
                        isToday
                          ? 'bg-teal-50/60 font-semibold text-slate-900'
                          : 'text-slate-700'
                      }
                    >
                      <td className="rounded-l-md py-2 pl-2 pr-4">
                        {h.day}
                        {isToday && (
                          <span className="ml-1.5 text-xs font-medium text-teal-700">
                            Today
                          </span>
                        )}
                      </td>
                      <td
                        className={`rounded-r-md py-2 pr-2 text-right ${
                          isClosed ? 'text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {h.text || 'Closed'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Hours not available.</p>
          )}
        </div>
      </section>

      {aboutGroups.length > 0 && (
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">About this provider</h2>
          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {aboutGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {group.title}
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckBadgeIcon className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
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
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold text-slate-900">Review breakdown</h2>
            {provider.rating !== null && (
              <p className="text-sm text-slate-600">
                <span className="text-base font-semibold text-slate-900">
                  {provider.rating.toFixed(1)}
                </span>
                {' / 5 from '}
                {(provider.review_count ?? 0).toLocaleString()} reviews
              </p>
            )}
          </div>
          <ReviewBreakdown provider={provider} />
        </section>
      )}

      <section className="mt-12 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-sm sm:p-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-300">
              Are you a provider?
            </p>
            <h2 className="mt-1 text-xl font-bold sm:text-2xl">
              Claim this listing
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Get featured placement, add photos, respond to inquiries, and
              track your performance.
            </p>
          </div>
          <ClaimListingButton
            providerName={provider.name}
            providerSlug={provider.slug}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100 sm:whitespace-nowrap"
          />
        </div>
      </section>

      {nearby.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Nearby Providers in {city.name}
          </h2>
          {/* Horizontal scroll on mobile, grid on desktop */}
          <ul className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0">
            {nearby.map((p) => (
              <li key={p.slug} className="w-[85%] shrink-0 snap-start sm:w-auto">
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

function ContactRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        {icon}
      </span>
      <span className="flex-1 leading-relaxed">{children}</span>
    </li>
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
    <div className="mt-5 space-y-2.5">
      {buckets.map(({ stars, count }) => {
        const widthPct = (count / max) * 100;
        const sharePct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={stars} className="flex items-center gap-3 text-sm">
            <span className="flex w-10 items-center justify-end gap-0.5 text-slate-700">
              {stars}
              <StarIcon className="h-3.5 w-3.5 text-amber-400" />
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all duration-300"
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <span className="w-20 text-right tabular-nums text-slate-500">
              {count.toLocaleString()} ({sharePct}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

function buildLocalBusinessJsonLd(provider: ProviderFull, canonicalUrl: string) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': canonicalUrl,
    name: provider.name,
    url: canonicalUrl,
  };
  if (provider.photo_url) jsonLd.image = provider.photo_url;
  if (provider.phone) jsonLd.telephone = provider.phone;
  if (provider.website) jsonLd.sameAs = [provider.website];

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
