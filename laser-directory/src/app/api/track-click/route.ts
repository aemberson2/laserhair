import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';

const ALLOWED_TYPES = new Set(['website', 'booking', 'call', 'quote', 'directions']);

function clean(v: unknown, max: number): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim().slice(0, max);
  return s.length > 0 ? s : null;
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'bad-json' }, { status: 400 });
  }

  const providerSlug = clean(body.providerSlug, 120);
  const clickType = clean(body.clickType, 40);
  if (!providerSlug || !clickType || !ALLOWED_TYPES.has(clickType)) {
    return NextResponse.json({ ok: false, error: 'bad-params' }, { status: 400 });
  }
  const city = clean(body.city, 120);
  const stateCode = clean(body.stateCode, 4)?.toUpperCase() ?? null;
  const referrerPage = clean(body.referrerPage, 500);

  try {
    const supabase = getSupabase();
    const { data: prov } = await supabase
      .from('providers')
      .select('id')
      .eq('slug', providerSlug)
      .maybeSingle();
    if (!prov) {
      return NextResponse.json({ ok: false, error: 'unknown-provider' }, { status: 404 });
    }

    const { error } = await supabase.from('provider_clicks').insert({
      provider_id: prov.id,
      click_type: clickType,
      city,
      state_code: stateCode,
      referrer_page: referrerPage,
    });
    if (error) {
      console.error('[track-click] insert failed:', error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[track-click] handler error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
