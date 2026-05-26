'use client';

import { useMemo, useState, useTransition } from 'react';
import { ProviderCard, type ProviderCardData } from './ProviderCard';

type Props = {
  providers: ProviderCardData[];
  categories: string[];
  stateSlug: string;
  citySlug: string;
};

type MinRating = 0 | 4 | 4.5;

export function ProviderListFilters({ providers, categories, stateSlug, citySlug }: Props) {
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
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Pill label="All ratings" active={minRating === 0} onClick={() => setMinRating(0)} />
          <Pill label="4+ stars" active={minRating === 4} onClick={() => setMinRating(4)} />
          <Pill label="4.5+ stars" active={minRating === 4.5} onClick={() => setMinRating(4.5)} />
          <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-slate-200 sm:inline-block" />
          <Pill
            label="Laser Specialists Only"
            active={specialistOnly}
            onClick={toggleSpecialist}
          />
          <Pill
            label="Online Booking"
            active={onlineBookingOnly}
            onClick={toggleOnlineBooking}
          />
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
  const padding = size === 'sm' ? 'px-3 py-1' : 'px-3.5 py-1.5';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full ${padding} text-sm font-medium transition duration-150 ease-out ${
        active
          ? 'bg-teal-600 text-white shadow-sm hover:bg-teal-700'
          : 'border border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:text-teal-700'
      }`}
    >
      {label}
    </button>
  );
}
