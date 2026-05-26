'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CitySearchEntry } from '@/lib/data';

type Props = {
  cities: CitySearchEntry[];
};

export function CitySearchBox({ cities }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const startsWith: CitySearchEntry[] = [];
    const contains: CitySearchEntry[] = [];
    for (const c of cities) {
      const name = c.name.toLowerCase();
      if (name.startsWith(q)) startsWith.push(c);
      else if (name.includes(q)) contains.push(c);
      if (startsWith.length >= 8) break;
    }
    return [...startsWith, ...contains].slice(0, 8);
  }, [query, cities]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const navigateTo = (c: CitySearchEntry) => {
    router.push(`/${c.stateSlug}/${c.citySlug}`);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      navigateTo(suggestions[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const hasResults = open && suggestions.length > 0;
  const noResults = open && query.trim().length >= 2 && suggestions.length === 0;

  return (
    <div
      ref={containerRef}
      className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row"
    >
      <div className="relative flex-1">
        <label htmlFor="home-search" className="sr-only">
          City or zip code
        </label>
        <input
          id="home-search"
          type="text"
          role="combobox"
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Enter your city or zip code..."
          aria-autocomplete="list"
          aria-expanded={hasResults}
          aria-controls="city-search-listbox"
          className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
        />
        {hasResults && (
          <ul
            id="city-search-listbox"
            role="listbox"
            className="absolute left-0 right-0 top-full z-10 mt-1 max-h-80 overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
          >
            {suggestions.map((c, i) => (
              <li key={`${c.stateCode}-${c.citySlug}`} role="option" aria-selected={i === highlight}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    navigateTo(c);
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  className={`block w-full px-4 py-2 text-left text-sm ${
                    i === highlight
                      ? 'bg-teal-50 text-teal-900'
                      : 'text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="ml-2 text-gray-500">{c.stateCode}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {noResults && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-lg">
            No cities match &ldquo;{query}&rdquo;.
          </div>
        )}
      </div>
      <Link
        href="/states"
        className="rounded-md bg-teal-600 px-6 py-3 text-center text-base font-medium text-white hover:bg-teal-700"
      >
        Browse by State
      </Link>
    </div>
  );
}
