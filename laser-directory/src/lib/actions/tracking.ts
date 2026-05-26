// Client-side click tracking. Fire-and-forget — must never block navigation.
//
// On the server, the matching POST handler lives at src/app/api/track-click/route.ts.
// We use navigator.sendBeacon when available because it keeps the request alive
// even after the page begins unloading on outbound navigation (Book/Call/Website).
// Falls back to fetch({ keepalive: true }).

export type ClickType = 'website' | 'booking' | 'call' | 'quote' | 'directions';

export type TrackClickParams = {
  providerSlug: string;
  clickType: ClickType;
  city?: string | null;
  stateCode?: string | null;
};

const ENDPOINT = '/api/track-click';

export function trackClick(params: TrackClickParams): void {
  // Server-side render guard
  if (typeof window === 'undefined') return;

  const payload = JSON.stringify({
    providerSlug: params.providerSlug,
    clickType: params.clickType,
    city: params.city ?? null,
    stateCode: params.stateCode ?? null,
    referrerPage: window.location.pathname + window.location.search,
  });

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      // sendBeacon prefers a Blob; the type hint is read as Content-Type on the request.
      const blob = new Blob([payload], { type: 'application/json' });
      const sent = navigator.sendBeacon(ENDPOINT, blob);
      if (sent) return;
    }
    // Fallback: keepalive fetch survives same-document and limited cross-document
    // navigation. Errors are swallowed so analytics never affects UX.
    void fetch(ENDPOINT, {
      method: 'POST',
      body: payload,
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
  } catch {
    // Never let analytics break navigation.
  }
}
