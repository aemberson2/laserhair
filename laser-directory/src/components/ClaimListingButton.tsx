'use client';

import { useState, useTransition } from 'react';
import { CheckBadgeIcon } from './Icons';
import { Modal } from './Modal';
import { submitClaim } from '@/lib/actions/claims';

type Role = '' | 'Owner' | 'Manager' | 'Marketing' | 'Other';

const ROLES: Role[] = ['Owner', 'Manager', 'Marketing', 'Other'];

type Props = {
  variant?: 'primary' | 'outline' | 'subtle';
  label?: string;
  providerName?: string;
  providerSlug?: string;
  className?: string;
};

export function ClaimListingButton({
  variant = 'primary',
  label = 'Claim This Listing',
  providerName,
  providerSlug,
  className,
}: Props) {
  const [open, setOpen] = useState(false);

  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition duration-150 ease-out';
  const variantClass =
    variant === 'primary'
      ? 'bg-slate-900 text-white shadow-sm hover:bg-slate-800'
      : variant === 'outline'
        ? 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400'
        : 'bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? `${base} ${variantClass}`}
      >
        {label}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={providerName ? `Claim ${providerName}` : 'Claim Your Listing'}
        subtitle="Get featured placement, add photos, respond to inquiries, and track your performance."
      >
        <ClaimForm
          providerName={providerName ?? ''}
          providerSlug={providerSlug}
          onClose={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}

function ClaimForm({
  providerName,
  providerSlug,
  onClose,
}: {
  providerName: string;
  providerSlug?: string;
  onClose: () => void;
}) {
  const [name, setName] = useState(providerName);
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitClaim({
        providerSlug: providerSlug ?? null,
        providerName: name,
        contactName: contact,
        email,
        phone,
        role,
      });
      if (result.ok) setSuccess(true);
      else setError(result.error);
    });
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckBadgeIcon className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-900">Got it.</h3>
        <p className="mt-2 text-sm text-slate-600">
          We&apos;ll reach out within one business day to verify your listing and
          walk you through next steps.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field id="claim-name" label="Business name" required>
        <input
          id="claim-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field id="claim-contact" label="Your name" required>
        <input
          id="claim-contact"
          type="text"
          required
          autoComplete="name"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className={inputClass}
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="claim-email" label="Email" required>
          <input
            id="claim-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field id="claim-phone" label="Phone" required>
          <input
            id="claim-phone"
            type="tel"
            required
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <Field id="claim-role" label="Your role" required>
        <select
          id="claim-role"
          required
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className={inputClass}
        >
          <option value="" disabled>
            Select your role…
          </option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </Field>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200"
        >
          {error}
        </p>
      )}

      <div className="sticky -bottom-6 -mx-6 mt-2 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white px-6 pb-6 pt-4 sm:static sm:m-0 sm:flex-row sm:justify-end sm:border-0 sm:p-0">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-12 items-center justify-center rounded-lg px-4 text-sm font-medium text-slate-600 hover:text-slate-900 sm:h-10"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-slate-900 px-4 text-base font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 sm:h-10 sm:w-auto sm:text-sm"
        >
          {isPending ? 'Submitting…' : 'Send Claim Request'}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  'block w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 shadow-sm placeholder:text-slate-400 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:text-sm sm:py-2.5';

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
