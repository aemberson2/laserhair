import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ClaimListingButton } from '@/components/ClaimListingButton';
import { CheckBadgeIcon, PlusIcon, SparklesIcon, StarIcon } from '@/components/Icons';
import { getHomeData } from '@/lib/data';
import { getSiteUrl } from '@/lib/site';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'For Providers — Grow Your Laser Hair Removal Business',
  description:
    'Get more laser hair removal clients. Join 2,200+ providers on the fastest-growing laser hair removal directory.',
};

const FAQS = [
  {
    q: 'Is the free listing really free?',
    a: "Yes — every operating provider in our directory has a free listing by default. It includes the business name, address, phone, hours, and aggregated rating. There's no catch.",
  },
  {
    q: 'How do you generate the leads?',
    a: 'Visitors who search by city, click a provider, or use the "Get a Free Quote" form on our city pages are routed to your inbox as qualified leads, including their treatment area, preferred timing, and contact info.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Premium and Elite plans are month-to-month with no contract. Cancel from your dashboard or by email and your listing reverts to the free tier at the end of the billing period.',
  },
  {
    q: 'Do you guarantee leads?',
    a: 'No directory can guarantee a specific lead volume — it varies by city, area, and how competitive your listing is. We do guarantee placement visibility and full analytics so you can see exactly what your subscription is producing.',
  },
  {
    q: 'How do I edit my listing?',
    a: 'Once your claim is verified (we confirm by phone or business email), you get dashboard access to update photos, hours, services, and booking links.',
  },
];

type Tier = {
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  cta: string;
  highlight?: boolean;
};

const TIERS: Tier[] = [
  {
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    description: 'Basic visibility for every operating provider.',
    features: [
      'Listed in every relevant city and state page',
      'Business name, address, phone, hours',
      'Aggregated rating and review count',
      'Standard placement in search results',
    ],
    cta: 'Claim Free Listing',
  },
  {
    name: 'Premium',
    price: '$99',
    cadence: 'per month',
    description: 'Featured placement and qualified leads in your city.',
    features: [
      'Featured placement above standard listings',
      'Add up to 10 photos and a logo',
      'Priority booking link placement',
      'Lead notifications delivered by email',
      'Analytics dashboard (views, clicks, leads)',
      'Custom listing description',
    ],
    cta: 'Get Started',
    highlight: true,
  },
  {
    name: 'Elite',
    price: '$249',
    cadence: 'per month',
    description: 'Top of every city you operate in, plus homepage exposure.',
    features: [
      'Everything in Premium',
      'Top placement in every city you serve',
      'Featured rotation on the homepage',
      'Dedicated account manager',
      'Quarterly performance review',
      'Priority lead routing',
    ],
    cta: 'Talk to Sales',
  },
];

export default async function ForProvidersPage() {
  const { totalProviders, totalCities } = await getHomeData();
  const providerCountStr = totalProviders > 0 ? totalProviders.toLocaleString() : '2,200+';
  const cityCountStr = totalCities > 0 ? totalCities.toLocaleString() : '300+';

  return (
    <>
      <Breadcrumb
        baseUrl={getSiteUrl()}
        items={[
          { label: 'Home', href: '/' },
          { label: 'For Providers', href: '/for-providers' },
        ]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-900 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-32 h-64 bg-gradient-to-b from-teal-500/30 to-transparent blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:py-20">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-xs font-medium text-teal-200 backdrop-blur">
            <SparklesIcon className="h-3.5 w-3.5" />
            For laser hair removal providers
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Get More Laser Hair
            <span className="block text-teal-300">Removal Clients</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-slate-300 sm:text-lg">
            Join {providerCountStr} providers on the fastest-growing laser hair
            removal directory. Free listing, paid options for serious growth.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ClaimListingButton
              variant="primary"
              label="Claim Your Listing"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
            />
            <a
              href="#pricing"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
            >
              See Pricing
            </a>
          </div>
          <p className="mt-6 text-xs text-slate-400">
            {providerCountStr} providers listed · {cityCountStr} cities covered
          </p>
        </div>
      </section>

      {/* Why it works */}
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Benefit
            title="Pre-qualified leads"
            body="Every lead specifies the body area they want treated, their city, and their preferred timing — no junk inquiries."
          />
          <Benefit
            title="Local SEO already built"
            body="We rank for high-intent terms like &lsquo;laser hair removal near me&rsquo; and city-specific searches across 300+ cities."
          />
          <Benefit
            title="Pay only for what works"
            body="Free listings stay free. Premium is month-to-month, no contract — cancel any time."
          />
        </div>

        {/* Pricing */}
        <section id="pricing" className="mt-20 scroll-mt-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Simple, honest pricing
            </h2>
            <p className="mt-2 text-slate-600">
              Free forever, or upgrade when you&apos;re ready for serious growth.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {TIERS.map((tier) => (
              <TierCard key={tier.name} tier={tier} />
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-slate-500">
            Prices in USD. No setup fees. Cancel any time.
          </p>
        </section>

        {/* FAQ */}
        <section className="mt-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="mx-auto mt-6 max-w-3xl divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 transition hover:bg-slate-50">
                  <span className="text-base font-medium text-slate-900">{faq.q}</span>
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700 transition duration-150 group-open:rotate-45"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </span>
                </summary>
                <p className="px-6 pb-5 text-sm leading-relaxed text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-20 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-rose-50 p-8 text-center sm:p-12">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Ready to grow?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-700">
            Claim your free listing now. Upgrade to Premium or Elite any time.
          </p>
          <div className="mt-6">
            <ClaimListingButton
              variant="primary"
              label="Claim Your Listing"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-teal-700"
            />
          </div>
        </section>
      </div>
    </>
  );
}

function Benefit({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
        <StarIcon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
    </div>
  );
}

function TierCard({ tier }: { tier: Tier }) {
  return (
    <div
      className={
        tier.highlight
          ? 'relative rounded-2xl border-2 border-teal-500 bg-white p-7 shadow-md'
          : 'rounded-2xl border border-slate-200 bg-white p-7 shadow-sm'
      }
    >
      {tier.highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
          Most Popular
        </span>
      )}
      <h3 className="text-lg font-bold text-slate-900">{tier.name}</h3>
      <p className="mt-1 text-sm text-slate-600">{tier.description}</p>
      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-4xl font-bold text-slate-900">{tier.price}</span>
        <span className="text-sm text-slate-500">/ {tier.cadence}</span>
      </div>
      <ul className="mt-6 space-y-2.5 text-sm">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-slate-700">
            <CheckBadgeIcon className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-7">
        <ClaimListingButton
          variant="primary"
          label={tier.cta}
          className={
            tier.highlight
              ? 'inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700'
              : 'inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50'
          }
        />
      </div>
    </div>
  );
}
