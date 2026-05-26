import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ChevronRightIcon } from '@/components/Icons';
import { getPostsByTopic } from '@/lib/blog';
import { getSiteUrl } from '@/lib/site';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Blog — Laser Hair Removal Guides, Cost, and Aftercare',
  description:
    'In-depth guides on laser hair removal cost, pain, aftercare, sessions needed, and how to choose the right provider. Written for real-world treatment decisions.',
};

export default function BlogIndexPage() {
  const groups = getPostsByTopic();
  const totalPosts = groups.reduce((s, g) => s + g.posts.length, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <Breadcrumb
        baseUrl={getSiteUrl()}
        items={[
          { label: 'Home', href: '/' },
          { label: 'Blog', href: '/blog' },
        ]}
      />

      <header className="mt-5">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          The Laser Hair Removal Guide
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          {totalPosts > 0
            ? `${totalPosts} research-backed guides on cost, treatment, aftercare, and how to choose the right provider — written for people actually booking sessions.`
            : 'Research-backed guides on cost, treatment, aftercare, and how to choose the right provider.'}
        </p>
      </header>

      {groups.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          No posts yet. Check back soon.
        </p>
      ) : (
        <div className="mt-10 space-y-12">
          {groups.map((group) => (
            <section key={group.topic}>
              <div className="flex items-end justify-between">
                <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {group.topic}
                </h2>
                <p className="text-sm text-slate-500">
                  {group.posts.length} {group.posts.length === 1 ? 'post' : 'posts'}
                </p>
              </div>
              <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.posts.map((post) => (
                  <li key={post.slug}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-150 ease-out hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                        {post.topic}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold leading-snug text-slate-900 group-hover:text-teal-700">
                        {post.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                        {post.description}
                      </p>
                      <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-teal-700">
                        Read article
                        <ChevronRightIcon className="h-4 w-4" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
