import Link from 'next/link';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-gray-600 sm:flex-row">
        <p>&copy; {year} Laser Directory</p>
        <nav className="flex items-center gap-5">
          <Link href="/about" className="hover:text-teal-600">About</Link>
        </nav>
      </div>
    </footer>
  );
}
