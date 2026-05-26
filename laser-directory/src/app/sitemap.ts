import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/blog';
import {
  getAllCityParams,
  getAllNeighborhoodParams,
  getAllProviderParams,
  getAllStateSlugs,
} from '@/lib/data';

const BASE_URL = 'https://www.laserhairnearme.com';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [stateSlugs, cityParams, providerParams, neighborhoodParams] = await Promise.all([
    getAllStateSlugs(),
    getAllCityParams(),
    getAllProviderParams(),
    getAllNeighborhoodParams(),
  ]);
  const posts = getAllPosts();

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/states`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/for-providers`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  for (const post of posts) {
    entries.push({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.date,
      changeFrequency: 'monthly',
      priority: 0.8,
    });
  }

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

  for (const { stateSlug, citySlug, neighborhoodSlug } of neighborhoodParams) {
    entries.push({
      url: `${BASE_URL}/${stateSlug}/${citySlug}/near/${neighborhoodSlug}`,
      changeFrequency: 'weekly',
      priority: 0.85,
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
