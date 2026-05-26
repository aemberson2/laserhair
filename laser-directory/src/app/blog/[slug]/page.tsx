import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import { CitySearchBox } from '@/components/CitySearchBox';
import { JsonLd } from '@/components/JsonLd';
import {
  getAllPosts,
  getPostBySlug,
  getPostSlugs,
  renderPost,
} from '@/lib/blog';
import { getAllCitiesForSearch, getTopCitiesNationwide } from '@/lib/data';
import { getSiteUrl, SITE_NAME } from '@/lib/site';

export const revalidate = 3600;

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Post not found' };
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const rendered = await renderPost(post);
  const allPosts = getAllPosts();
  const related = allPosts.filter((p) => post.relatedPosts.includes(p.slug));
  const [cities, topCities] = await Promise.all([
    getAllCitiesForSearch(),
    getTopCitiesNationwide(6),
  ]);
  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/blog/${post.slug}`;

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Organization', name: post.author },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    mainEntityOfPage: canonicalUrl,
    keywords: post.keywords.join(', '),
    inLanguage: 'en-US',
  };

  const dateFmt = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <JsonLd data={articleJsonLd} />

      <Breadcrumb
        baseUrl={siteUrl}
        items={[
          { label: 'Home', href: '/' },
          { label: 'Blog', href: '/blog' },
          { label: post.title, href: `/blog/${post.slug}` },
        ]}
      />

      <article className="mx-auto mt-5 grid max-w-[680px] grid-cols-1 gap-10 lg:max-w-[960px] lg:grid-cols-[minmax(0,680px)_240px]">
        <div className="min-w-0">
          <header>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              {post.topic}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {post.title}
            </h1>
            <p className="mt-3 text-base text-slate-600">{post.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>By {post.author}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={post.date}>{dateFmt}</time>
            </div>
          </header>

          {rendered.toc.length > 1 && (
            <nav
              aria-label="Table of contents"
              className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:hidden"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                In this article
              </p>
              <ol className="mt-3 space-y-1.5 text-sm">
                {rendered.toc.map((item, i) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="flex gap-2 text-slate-700 transition hover:text-teal-700"
                    >
                      <span className="text-slate-400">{i + 1}.</span>
                      <span>{item.text}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <div
            className="post-content mt-8"
            dangerouslySetInnerHTML={{ __html: rendered.contentHtml }}
          />

          {related.length > 0 && (
            <section className="mt-12 border-t border-slate-200 pt-8">
              <h2 className="text-xl font-bold text-slate-900">Related reading</h2>
              <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link
                      href={`/blog/${r.slug}`}
                      className="group block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-150 hover:border-teal-300 hover:shadow-md"
                    >
                      <p className="text-xs font-medium uppercase tracking-wider text-teal-700">
                        {r.topic}
                      </p>
                      <p className="mt-1 font-semibold text-slate-900 group-hover:text-teal-700">
                        {r.title}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {topCities.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                Browse Providers by City
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Most-searched metros in our directory.
              </p>
              <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {topCities.map((c) => (
                  <li key={`${c.state_code}-${c.city_slug}`}>
                    <Link
                      href={`/${c.state_slug}/${c.city_slug}`}
                      className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition duration-150 hover:border-teal-300 hover:shadow-md"
                    >
                      <span>
                        <span className="font-semibold text-slate-900 group-hover:text-teal-700">
                          {c.name}
                        </span>
                        <span className="ml-1.5 text-sm text-slate-500">
                          {c.state_code}
                        </span>
                      </span>
                      <span className="text-sm text-slate-500">
                        {c.provider_count.toLocaleString()} providers
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-12 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-rose-50 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Find Laser Hair Removal Near You
            </h2>
            <p className="mt-2 text-sm text-slate-700">
              Search by city or zip to see vetted providers, real ratings, and
              direct booking links.
            </p>
            <div className="mt-2">
              <CitySearchBox cities={cities} />
            </div>
          </section>
        </div>

        {rendered.toc.length > 1 && (
          <aside className="hidden lg:block">
            <nav
              aria-label="Table of contents"
              className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                In this article
              </p>
              <ol className="mt-3 space-y-2 text-sm">
                {rendered.toc.map((item, i) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="flex gap-2 text-slate-700 transition hover:text-teal-700"
                    >
                      <span className="text-slate-400">{i + 1}.</span>
                      <span>{item.text}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>
        )}
      </article>
    </div>
  );
}
