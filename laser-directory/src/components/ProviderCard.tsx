import Link from 'next/link';
import {
  CheckBadgeIcon,
  GlobeIcon,
  MapPinIcon,
  PhoneIcon,
  SparklesIcon,
} from './Icons';
import { StarRating } from './StarRating';

export type ProviderCardData = {
  slug: string;
  name: string;
  photo_url: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  booking_url: string | null;
  rating: number | null;
  review_count: number | null;
  subtypes: string[] | null;
  is_verified: boolean | null;
  is_laser_specialist: boolean | null;
};

function initials(name: string): string {
  const words = name
    .replace(/[^a-zA-Z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function digitsOnly(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export function ProviderCard({ provider, href }: { provider: ProviderCardData; href: string }) {
  const tags = (provider.subtypes ?? []).slice(0, 3);
  const phoneHref = provider.phone ? `tel:${digitsOnly(provider.phone)}` : null;

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-150 ease-out hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-lg">
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-48 sm:shrink-0">
          {provider.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={provider.photo_url}
              alt=""
              loading="lazy"
              className="h-48 w-full object-cover sm:h-full"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-teal-50 to-rose-50 text-3xl font-semibold text-teal-700 sm:h-full"
            >
              {initials(provider.name)}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-900">
              <Link href={href} className="transition hover:text-teal-700">
                {provider.name}
              </Link>
            </h3>
            <div className="flex flex-wrap gap-1.5">
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
            </div>
          </div>

          <StarRating rating={provider.rating} reviewCount={provider.review_count} />

          {provider.address && (
            <p className="flex items-start gap-1.5 text-sm text-slate-600">
              <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <span>{provider.address}</span>
            </p>
          )}

          {phoneHref && (
            <a
              href={phoneHref}
              className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-teal-700 transition hover:text-teal-800"
            >
              <PhoneIcon className="h-4 w-4" />
              {provider.phone}
            </a>
          )}

          {tags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}

          {(provider.booking_url || provider.website || phoneHref) && (
            <div className="mt-1 flex flex-wrap gap-2">
              {provider.booking_url && (
                <a
                  href={provider.booking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition duration-150 ease-out hover:bg-teal-700"
                >
                  Book Now
                </a>
              )}
              {phoneHref && (
                <a
                  href={phoneHref}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-teal-600 px-3.5 py-2 text-sm font-medium text-teal-700 transition duration-150 ease-out hover:bg-teal-50"
                >
                  <PhoneIcon className="h-4 w-4" />
                  Call
                </a>
              )}
              {provider.website && (
                <a
                  href={provider.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition duration-150 ease-out hover:border-slate-400 hover:bg-slate-50"
                >
                  <GlobeIcon className="h-4 w-4" />
                  Website
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
