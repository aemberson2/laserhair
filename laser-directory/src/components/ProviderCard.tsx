import Link from 'next/link';
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

const PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='200' height='200' fill='%23f3f4f6'/><path d='M70 130c0-16 13-30 30-30s30 14 30 30M100 90a18 18 0 100-36 18 18 0 000 36z' fill='%239ca3af'/></svg>";

export function ProviderCard({ provider, href }: { provider: ProviderCardData; href: string }) {
  const tags = (provider.subtypes ?? []).slice(0, 3);

  return (
    <article className="overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:shadow-md">
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-40 sm:shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={provider.photo_url ?? PLACEHOLDER}
            alt=""
            loading="lazy"
            className="h-40 w-full object-cover sm:h-full"
          />
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-gray-900">
              <Link href={href} className="hover:text-teal-700">
                {provider.name}
              </Link>
            </h3>
            <div className="flex flex-wrap gap-1.5">
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
            </div>
          </div>

          <StarRating rating={provider.rating} reviewCount={provider.review_count} />

          {provider.address && (
            <p className="text-sm text-gray-600">{provider.address}</p>
          )}

          {provider.phone && (
            <a
              href={`tel:${provider.phone.replace(/[^\d+]/g, '')}`}
              className="text-sm text-teal-600 hover:underline"
            >
              {provider.phone}
            </a>
          )}

          {tags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}

          {(provider.booking_url || provider.website) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {provider.booking_url && (
                <a
                  href={provider.booking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
                >
                  Book Now
                </a>
              )}
              {provider.website && (
                <a
                  href={provider.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-teal-600 px-3 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-50"
                >
                  Visit Website
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
