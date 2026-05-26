'use client';

import { useMemo, useState, useTransition } from 'react';
import { ProviderCard, type ProviderCardData } from './ProviderCard';

type Props = {
  providers: ProviderCardData[];
  categories: string[];
  stateSlug: string;
  citySlug: string;
  cityName: string;
  stateCode: string;
};

type MinRating = 0 | 4 | 4.5;

export function ProviderListFilters({
  providers,
  categories,
  stateSlug,
  citySlug,
  cityName,
  stateCode,
}: Props) {
  const [minRating, setMinRatingState] = useState<MinRating>(0);
  const [specialistOnly, setSpecialistOnlyState] = useState(false);
  const [onlineBookingOnly, setOnlineBookingOnlyState] = useState(false);
  const [selectedCategories, setSelectedCategoriesState] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const setMinRating = (v: MinRating) => startTransition(() => setMinRatingState(v));
  const toggleSpecialist = () =>
    startTransition(() => setSpecialistOnlyState((v) => !v));
  const toggleOnlineBooking = () =>
    startTransition(() => setOnlineBookingOnlyState((v) => !v));
  const setSelectedCategories = (updater: (prev: Set<string>) => Set<string>) =>
    startTransition(() => setSelectedCategoriesState(updater));

  const filtered = useMemo(() => {
    return providers.filter((p) => {
      if (minRating > 0 && (p.rating ?? 0) < minRating) return false;
      if (specialistOnly && !p.is_laser_specialist) return false;
      if (onlineBookingOnly && !p.booking_url) return false;
      if (selectedCategories.size > 0) {
        const subs = p.subtypes ?? [];
        const match = subs.some((s) => selectedCategories.has(s));
        if (!match) return false;
      }
      return true;
    });
  }, [providers, minRating, specialistOnly, onlineBookingOnly, selectedCategories]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const reset = () => {
    startTransition(() => {
      setMinRatingState(0);
      setSpecialistOnlyState(false);
      setOnlineBookingOnlyState(false);
      setSelectedCategoriesState(new Set());
    });
  };

  const anyActive =
    minRating > 0 ||
    specialistOnly ||
    onlineBookingOnly ||
    selectedCategories.size > 0;

  return (
    <div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        {/* Horizontal scroll on mobile so the pill row never wraps into a
            three-row pile; wraps normally on sm+ where there's more room. */}
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
          <div className="flex w-max items-center gap-2 sm:w-auto sm:flex-wrap">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Rating
            </span>
            <Pill label="All" active={minRating === 0} onClick={() => setMinRating(0)} size="sm" />
            <Pill label="4+" active={minRating === 4} onClick={() => setMinRating(4)} size="sm" />
            <Pill label="4.5+" active={minRating === 4.5} onClick={() => setMinRating(4.5)} size="sm" />
            <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-slate-200 sm:inline-block" />
            <Pill
              label="Laser Specialists"
              active={specialistOnly}
              onClick={toggleSpecialist}
              size="sm"
            />
            <Pill
              label="Online Booking"
              active={onlineBookingOnly}
              onClick={toggleOnlineBooking}
              size="sm"
            />
          </div>
        </div>

        {categories.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-700">Categories</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Pill
                  key={cat}
                  label={cat}
                  active={selectedCategories.has(cat)}
                  onClick={() => toggleCategory(cat)}
                  size="sm"
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <span>
            Showing <span className="font-semibold text-slate-900">{filtered.length}</span> of{' '}
            {providers.length} {providers.length === 1 ? 'provider' : 'providers'}
          </span>
          {anyActive && (
            <button
              type="button"
              onClick={reset}
              className="text-teal-700 transition hover:text-teal-800 hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      <div
        aria-busy={isPending}
        aria-live="polite"
        className={
          isPending
            ? 'pointer-events-none mt-6 opacity-60 transition-opacity duration-150'
            : 'mt-6 transition-opacity duration-150'
        }
      >
        {filtered.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filtered.map((p) => (
              <li key={p.slug}>
                <ProviderCard
                  provider={p}
                  href={`/${stateSlug}/${citySlug}/${p.slug}`}
                  context={{ city: cityName, stateCode }}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            No providers match these filters.
          </p>
        )}
      </div>
    </div>
  );
}

function Pill({
  label,
  active,
  onClick,
  size = 'md',
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  size?: 'sm' | 'md';
}) {
  const padding = size === 'sm' ? 'px-3.5 py-2 whitespace-nowrap' : 'px-4 py-2.5 whitespace-nowrap';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full ${padding} text-sm font-medium transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${
        active
          ? 'bg-teal-600 text-white shadow-sm hover:bg-teal-700'
          : 'border border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:text-teal-700'
      }`}
    >
      {label}
    </button>
  );
}
