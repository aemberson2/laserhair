'use server';

import { getSupabase } from '@/lib/supabase';

export type LeadSubmission = {
  name: string;
  email: string;
  phone: string;
  treatmentArea: string;
  preferredProvider?: string;
  providerSlug?: string | null;
  city?: string;
  stateCode?: string;
  message?: string;
};

export type LeadResult =
  | { ok: true }
  | { ok: false; error: string };

const ALLOWED_AREAS = new Set([
  'Face',
  'Underarms',
  'Bikini/Brazilian',
  'Legs',
  'Back',
  'Full Body',
  'Other',
]);

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

export async function submitLead(input: LeadSubmission): Promise<LeadResult> {
  const name = clean(input.name, 120);
  const email = clean(input.email, 200).toLowerCase();
  const phone = clean(input.phone, 40);
  const treatmentArea = clean(input.treatmentArea, 60);
  const preferredProvider = clean(input.preferredProvider, 200) || null;
  const providerSlug = clean(input.providerSlug ?? '', 120) || null;
  const city = clean(input.city, 120) || null;
  const stateCode = clean(input.stateCode, 4)?.toUpperCase() || null;
  const message = clean(input.message, 2000) || null;

  if (!name) return { ok: false, error: 'Name is required.' };
  if (!email || !isEmail(email)) return { ok: false, error: 'Please enter a valid email.' };
  if (!phone || !isPhone(phone)) return { ok: false, error: 'Please enter a valid phone number.' };
  if (!treatmentArea || !ALLOWED_AREAS.has(treatmentArea)) {
    return { ok: false, error: 'Please select a treatment area.' };
  }

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

    const { error } = await supabase.from('leads').insert({
      name,
      email,
      phone,
      treatment_area: treatmentArea,
      preferred_provider: preferredProvider,
      provider_id: providerId,
      city,
      state_code: stateCode,
      message,
    });
    if (error) throw error;
    // Notification hook (logged for now; wire to email/Slack/webhook later).
    console.log('[lead]', { name, email, city, stateCode, providerSlug, providerId });
    return { ok: true };
  } catch (err) {
    console.error('submitLead failed:', err);
    return { ok: false, error: 'Something went wrong. Please try again or email hello@laserhairnearme.com.' };
  }
}
