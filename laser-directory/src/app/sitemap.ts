import type { MetadataRoute } from 'next';
import { getAllCityParams, getAllProviderParams, getAllStateSlugs } from '@/lib/data';
import { getSiteUrl } from '@/lib/site';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const [stateSlugs, cityParams, providerParams] = await Promise.all([
    getAllStateSlugs(),
    getAllCityParams(),
    getAllProviderParams(),
  ]);

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ];

  for (const slug of stateSlugs) {
    entries.push({
      url: `${baseUrl}/${slug}`,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  for (const { stateSlug, citySlug } of cityParams) {
    entries.push({
      url: `${baseUrl}/${stateSlug}/${citySlug}`,
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  }

  for (const { stateSlug, citySlug, providerSlug } of providerParams) {
    entries.push({
      url: `${baseUrl}/${stateSlug}/${citySlug}/${providerSlug}`,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  return entries;
}
