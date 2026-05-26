import Link from 'next/link';
import { SparklesIcon } from './Icons';

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
        <Link
          href="/"
          className="group flex items-center gap-2 text-slate-900 transition duration-150 hover:text-teal-700"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-sm">
            <SparklesIcon className="h-4 w-4" />
          </span>
          <span className="text-base font-semibold tracking-tight">
            LaserHair<span className="text-teal-600">NearMe</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2 text-sm">
          <Link
            href="/states"
            className="rounded-md px-2.5 py-1.5 text-slate-700 transition duration-150 hover:bg-slate-50 hover:text-teal-700"
          >
            Browse by State
          </Link>
          <Link
            href="/blog"
            className="rounded-md px-2.5 py-1.5 text-slate-700 transition duration-150 hover:bg-slate-50 hover:text-teal-700"
          >
            Blog
          </Link>
          <Link
            href="/about"
            className="rounded-md px-2.5 py-1.5 text-slate-700 transition duration-150 hover:bg-slate-50 hover:text-teal-700"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
