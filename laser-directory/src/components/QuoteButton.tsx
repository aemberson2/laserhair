'use client';

import { useState, useTransition } from 'react';
import { CheckBadgeIcon } from './Icons';
import { Modal } from './Modal';
import { submitLead } from '@/lib/actions/leads';
import { trackClick } from '@/lib/actions/tracking';

type TreatmentArea =
  | ''
  | 'Face'
  | 'Underarms'
  | 'Bikini/Brazilian'
  | 'Legs'
  | 'Back'
  | 'Full Body'
  | 'Other';

const AREAS: TreatmentArea[] = [
  'Face',
  'Underarms',
  'Bikini/Brazilian',
  'Legs',
  'Back',
  'Full Body',
  'Other',
];

type Props = {
  /** Visual style of the trigger button. */
  variant?: 'primary' | 'outline' | 'subtle' | 'link';
  /** Label override. */
  label?: string;
  /** When set, the form's preferred provider field is pre-filled and providerSlug is sent. */
  providerName?: string;
  providerSlug?: string;
  /** When set, city + state are pre-filled. */
  city?: string;
  stateCode?: string;
  /** Optional className override on the trigger. */
  className?: string;
};

export function QuoteButton({
  variant = 'primary',
  label = 'Get a Free Quote',
  providerName,
  providerSlug,
  city,
  stateCode,
  className,
}: Props) {
  const [open, setOpen] = useState(false);

  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition duration-150 ease-out';
  const variantClass =
    variant === 'primary'
      ? 'bg-teal-600 text-white shadow-sm hover:bg-teal-700'
      : variant === 'outline'
        ? 'border border-teal-600 text-teal-700 hover:bg-teal-50'
        : variant === 'subtle'
          ? 'bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200 hover:bg-teal-100'
          : 'text-teal-700 hover:text-teal-800 hover:underline';

  const handleOpen = () => {
    if (providerSlug) {
      trackClick({
        providerSlug,
        clickType: 'quote',
        city,
        stateCode,
      });
    }
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={className ?? `${base} ${variantClass}`}
      >
        {label}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Get a Free Quote"
        subtitle={
          city
            ? `We'll connect you with top-rated providers in ${city}${stateCode ? ', ' + stateCode : ''}.`
            : "We'll connect you with top-rated providers near you."
        }
      >
        <LeadForm
          providerName={providerName}
          providerSlug={providerSlug}
          city={city}
          stateCode={stateCode}
          onClose={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}

function LeadForm({
  providerName,
  providerSlug,
  city,
  stateCode,
  onClose,
}: {
  providerName?: string;
  providerSlug?: string;
  city?: string;
  stateCode?: string;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [treatmentArea, setTreatmentArea] = useState<TreatmentArea>('');
  const [preferredProvider, setPreferredProvider] = useState(providerName ?? '');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitLead({
        name,
        email,
        phone,
        treatmentArea,
        preferredProvider: preferredProvider || undefined,
        providerSlug: providerSlug ?? null,
        city,
        stateCode,
        message: message || undefined,
      });
      if (result.ok) {
        setSuccess(true);
      } else {
        setError(result.error);
      }
    });
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckBadgeIcon className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-900">Thanks, {name.split(' ')[0] || 'we got it'}!</h3>
        <p className="mt-2 text-sm text-slate-600">
          {city
            ? `We'll connect you with top-rated providers in ${city}${stateCode ? ', ' + stateCode : ''}.`
            : "We'll connect you with top-rated providers near you."}{' '}
          Look out for an email in the next business day.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field id="lead-name" label="Full name" required>
        <input
          id="lead-name"
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="lead-email" label="Email" required>
          <input
            id="lead-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field id="lead-phone" label="Phone" required>
          <input
            id="lead-phone"
            type="tel"
            required
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
            placeholder="(555) 555-1234"
          />
        </Field>
      </div>

      <Field id="lead-area" label="Treatment area" required>
        <select
          id="lead-area"
          required
          value={treatmentArea}
          onChange={(e) => setTreatmentArea(e.target.value as TreatmentArea)}
          className={inputClass}
        >
          <option value="" disabled>
            Select an area…
          </option>
          {AREAS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </Field>

      <Field id="lead-provider" label="Preferred provider (optional)">
        <input
          id="lead-provider"
          type="text"
          value={preferredProvider}
          onChange={(e) => setPreferredProvider(e.target.value)}
          className={inputClass}
          placeholder="Name a provider you're interested in"
        />
      </Field>

      <Field id="lead-message" label="Anything else? (optional)">
        <textarea
          id="lead-message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={inputClass}
          placeholder="Schedule preferences, budget, skin type, etc."
        />
      </Field>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200"
        >
          {error}
        </p>
      )}

      <p className="text-xs text-slate-500">
        By submitting, you agree to be contacted about laser hair removal services. We
        never sell your information.
      </p>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? 'Submitting…' : 'Get My Free Quote'}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20';

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-rose-600">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
