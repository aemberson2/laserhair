import type { MetadataRoute } from 'next';
import { getAllCityParams, getAllProviderParams, getAllStateSlugs } from '@/lib/data';

const BASE_URL = 'https://www.laserhairnearme.com';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [stateSlugs, cityParams, providerParams] = await Promise.all([
    getAllStateSlugs(),
    getAllCityParams(),
    getAllProviderParams(),
  ]);

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ];

  for (const slug of stateSlugs) {
    entries.push({
      url: `${BASE_URL}/${slug}`,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  for (const { stateSlug, citySlug } of cityParams) {
    entries.push({
      url: `${BASE_URL}/${stateSlug}/${citySlug}`,
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  }

  for (const { stateSlug, citySlug, providerSlug } of providerParams) {
    entries.push({
      url: `${BASE_URL}/${stateSlug}/${citySlug}/${providerSlug}`,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  return entries;
}
