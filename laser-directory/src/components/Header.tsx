import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold text-gray-900">
          Laser Directory
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/states" className="text-gray-700 hover:text-teal-600">
            Browse by State
          </Link>
          <Link href="/about" className="text-gray-700 hover:text-teal-600">
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
