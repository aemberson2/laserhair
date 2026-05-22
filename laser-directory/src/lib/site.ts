export const SITE_NAME = 'Laser Directory';

const FALLBACK_SITE_URL = 'https://www.laserhairnearme.com';

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return FALLBACK_SITE_URL;
  return raw.replace(/\/+$/, '');
}
