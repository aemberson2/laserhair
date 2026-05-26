import { PhoneIcon, StarIcon } from './Icons';

type Props = {
  name: string;
  rating: number | null;
  bookingUrl: string | null;
  phone: string | null;
  href: string;
};

export function StickyMobileCTA({ name, rating, bookingUrl, phone, href }: Props) {
  const phoneDigits = phone ? phone.replace(/[^\d+]/g, '') : null;
  const primary = bookingUrl
    ? { href: bookingUrl, label: 'Book Now', external: true }
    : phoneDigits
      ? { href: `tel:${phoneDigits}`, label: 'Call', external: false }
      : { href, label: 'View', external: false };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 lg:hidden">
      <div className="pointer-events-auto mx-auto max-w-2xl border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.15)] backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-teal-700">
              Top-Rated
            </p>
            <a
              href={href}
              className="block truncate text-sm font-semibold text-slate-900 hover:text-teal-700"
            >
              {name}
            </a>
            {rating !== null && (
              <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-600">
                <StarIcon className="h-3 w-3 text-amber-400" />
                {rating.toFixed(1)}
              </span>
            )}
          </div>
          <a
            href={primary.href}
            {...(primary.external
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-teal-700"
          >
            {primary.label === 'Call' && <PhoneIcon className="h-4 w-4" />}
            {primary.label}
          </a>
        </div>
      </div>
    </div>
  );
}
