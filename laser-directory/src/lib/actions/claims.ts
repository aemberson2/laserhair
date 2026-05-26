'use server';

import { getSupabase } from '@/lib/supabase';

export type ClaimSubmission = {
  providerSlug?: string | null;
  providerName: string;
  contactName: string;
  email: string;
  phone: string;
  role: string;
};

export type ClaimResult =
  | { ok: true }
  | { ok: false; error: string };

const ALLOWED_ROLES = new Set(['Owner', 'Manager', 'Marketing', 'Other']);

function clean(s: string | undefined | null, max = 500): string {
  return (s ?? '').trim().slice(0, max);
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function isPhone(s: string): boolean {
  const digits = s.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

export async function submitClaim(input: ClaimSubmission): Promise<ClaimResult> {
  const providerSlug = clean(input.providerSlug ?? '', 120) || null;
  const providerName = clean(input.providerName, 240);
  const contactName = clean(input.contactName, 120);
  const email = clean(input.email, 200).toLowerCase();
  const phone = clean(input.phone, 40);
  const role = clean(input.role, 40);

  if (!providerName) return { ok: false, error: 'Provider name is required.' };
  if (!contactName) return { ok: false, error: 'Contact name is required.' };
  if (!email || !isEmail(email)) return { ok: false, error: 'Please enter a valid email.' };
  if (!phone || !isPhone(phone)) return { ok: false, error: 'Please enter a valid phone number.' };
  if (!role || !ALLOWED_ROLES.has(role)) return { ok: false, error: 'Please pick a role.' };

  try {
    const supabase = getSupabase();

    let providerId: string | null = null;
    if (providerSlug) {
      const { data: prov } = await supabase
        .from('providers')
        .select('id')
        .eq('slug', providerSlug)
        .maybeSingle();
      providerId = prov?.id ?? null;
    }

    const { error } = await supabase.from('provider_claims').insert({
      provider_id: providerId,
      provider_name: providerName,
      contact_name: contactName,
      email,
      phone,
      role,
    });
    if (error) throw error;
    console.log('[provider_claim]', { providerName, contactName, email, providerSlug });
    return { ok: true };
  } catch (err) {
    console.error('submitClaim failed:', err);
    return { ok: false, error: 'Something went wrong. Please try again or email hello@laserhairnearme.com.' };
  }
}
