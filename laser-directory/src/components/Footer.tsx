import Link from 'next/link';
import { SparklesIcon } from './Icons';
import { getLatestPosts } from '@/lib/blog';
import { getTopCitiesNationwide } from '@/lib/data';

export async function Footer() {
  const year = new Date().getFullYear();
  const [topCities, recentPosts] = await Promise.all([
    getTopCitiesNationwide(10),
    Promise.resolve(getLatestPosts(5)),
  ]);

  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2 text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-sm">
              <SparklesIcon className="h-4 w-4" />
            </span>
            <span className="text-base font-semibold tracking-tight">
              LaserHair<span className="text-teal-600">NearMe</span>
            </span>
          </Link>
          <p className="mt-3 text-sm text-slate-600">
            A free directory of vetted laser hair removal providers across the
            United States.
          </p>
        </div>

        <FooterColumn title="Browse">
          <FooterLink href="/states">All States</FooterLink>
          <FooterLink href="/">Top Cities</FooterLink>
          <FooterLink href="/blog">Blog</FooterLink>
        </FooterColumn>

        <FooterColumn title="Company">
          <FooterLink href="/about">About</FooterLink>
          <FooterLink href="mailto:hello@laserhairnearme.com">Contact</FooterLink>
        </FooterColumn>

        <FooterColumn title="For Providers">
          <FooterLink href="/for-providers">Plans & Pricing</FooterLink>
          <FooterLink href="/for-providers">Claim Your Listing</FooterLink>
          <FooterLink href="/dashboard">Provider Dashboard</FooterLink>
          <FooterLink href="mailto:hello@laserhairnearme.com">Report an Error</FooterLink>
        </FooterColumn>
      </div>

      {(topCities.length > 0 || recentPosts.length > 0) && (
        <div className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-2">
            {topCities.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Top Cities
                </h3>
                <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  {topCities.map((c) => (
                    <li key={`${c.state_code}-${c.city_slug}`}>
                      <Link
                        href={`/${c.state_slug}/${c.city_slug}`}
                        className="text-slate-700 transition duration-150 hover:text-teal-700"
                      >
                        {c.name}, {c.state_code}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {recentPosts.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Latest from the Blog
                </h3>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {recentPosts.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/blog/${p.slug}`}
                        className="text-slate-700 transition duration-150 hover:text-teal-700"
                      >
                        {p.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row">
          <p>&copy; {year} LaserHairNearMe.com</p>
          <p>Not a medical provider. Always consult a licensed professional.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      <ul className="mt-3 space-y-2 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-slate-700 transition duration-150 hover:text-teal-700"
      >
        {children}
      </Link>
    </li>
  );
}
