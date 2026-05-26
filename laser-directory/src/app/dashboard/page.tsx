import type { Metadata } from 'next';
import Link from 'next/link';
import { ClaimListingButton } from '@/components/ClaimListingButton';
import { SparklesIcon } from '@/components/Icons';

export const metadata: Metadata = {
  title: 'Provider Dashboard',
  description:
    'Track your listing views, leads, and performance on LaserHairNearMe.',
};

export default function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-sm">
        <SparklesIcon className="h-6 w-6" />
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-teal-700">
        Provider Dashboard
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Coming Soon
      </h1>
      <p className="mt-3 max-w-md text-slate-600">
        Track your listing views, leads, photo performance, and click-through rate in
        one place. We&apos;re onboarding the first wave of claimed providers now.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ClaimListingButton
          variant="primary"
          label="Claim Your Listing"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
        />
        <a
          href="mailto:hello@laserhairnearme.com"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          Email hello@laserhairnearme.com
        </a>
      </div>
      <p className="mt-10 text-sm text-slate-500">
        Already a provider on the directory?{' '}
        <Link href="/for-providers" className="font-medium text-teal-700 hover:underline">
          See plans and pricing
        </Link>
      </p>
    </div>
  );
}
