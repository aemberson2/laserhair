'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { SparklesIcon } from './Icons';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/states', label: 'Browse by State' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
  { href: '/for-providers', label: 'For Providers' },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-md text-slate-700 transition hover:bg-slate-50 hover:text-teal-700 lg:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {open && typeof document !== 'undefined' &&
        createPortal(<Drawer onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function Drawer({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Main menu"
      className="fixed inset-0 z-50 lg:hidden"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <Link href="/" className="flex items-center gap-2 text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-sm">
              <SparklesIcon className="h-4 w-4" />
            </span>
            <span className="text-base font-semibold tracking-tight">
              LaserHair<span className="text-teal-600">NearMe</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-11 w-11 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={onClose}
                  className="flex min-h-[48px] items-center rounded-lg px-3 text-base font-medium text-slate-800 transition hover:bg-slate-50 hover:text-teal-700"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-slate-100 p-4">
          <Link
            href="/for-providers"
            onClick={onClose}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-teal-600 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            Claim Your Listing
          </Link>
        </div>
      </div>
    </div>
  );
}
