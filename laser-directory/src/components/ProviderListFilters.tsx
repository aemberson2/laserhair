'use client';

import { useMemo, useState } from 'react';
import { ProviderCard, type ProviderCardData } from './ProviderCard';

type Props = {
  providers: ProviderCardData[];
  categories: string[];
  stateSlug: string;
  citySlug: string;
};

type MinRating = 0 | 4 | 4.5;

export function ProviderListFilters({ providers, categories, stateSlug, citySlug }: Props) {
  const [minRating, setMinRating] = useState<MinRating>(0);
  const [specialistOnly, setSpecialistOnly] = useState(false);
  const [onlineBookingOnly, setOnlineBookingOnly] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

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
    setMinRating(0);
    setSpecialistOnly(false);
    setOnlineBookingOnly(false);
    setSelectedCategories(new Set());
  };

  const anyActive =
    minRating > 0 ||
    specialistOnly ||
    onlineBookingOnly ||
    selectedCategories.size > 0;

  return (
    <div>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <RatingButton
            label="All ratings"
            active={minRating === 0}
            onClick={() => setMinRating(0)}
          />
          <RatingButton
            label="4+ stars"
            active={minRating === 4}
            onClick={() => setMinRating(4)}
          />
          <RatingButton
            label="4.5+ stars"
            active={minRating === 4.5}
            onClick={() => setMinRating(4.5)}
          />
          <span className="mx-2 hidden h-5 w-px bg-gray-300 sm:inline-block" />
          <ToggleButton
            label="Laser Specialists Only"
            active={specialistOnly}
            onClick={() => setSpecialistOnly((v) => !v)}
          />
          <ToggleButton
            label="Online Booking Available"
            active={onlineBookingOnly}
            onClick={() => setOnlineBookingOnly((v) => !v)}
          />
        </div>

        {categories.length > 0 && (
          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-gray-700">Categories</legend>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {categories.map((cat) => (
                <label
                  key={cat}
                  className="flex cursor-pointer items-center gap-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-600"
                    checked={selectedCategories.has(cat)}
                    onChange={() => toggleCategory(cat)}
                  />
                  {cat}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filtered.length} of {providers.length}{' '}
            {providers.length === 1 ? 'provider' : 'providers'}
          </span>
          {anyActive && (
            <button
              type="button"
              onClick={reset}
              className="text-teal-600 hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {filtered.length > 0 ? (
        <ul className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((p) => (
            <li key={p.slug}>
              <ProviderCard provider={p} href={`/${stateSlug}/${citySlug}/${p.slug}`} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          No providers match these filters.
        </p>
      )}
    </div>
  );
}

function RatingButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? 'rounded-full bg-teal-600 px-3 py-1.5 text-sm font-medium text-white'
          : 'rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-teal-600 hover:text-teal-700'
      }
    >
      {label}
    </button>
  );
}

function ToggleButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? 'rounded-full bg-teal-600 px-3 py-1.5 text-sm font-medium text-white'
          : 'rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-teal-600 hover:text-teal-700'
      }
    >
      {label}
    </button>
  );
}
