import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const POSTS_DIR = resolve(process.cwd(), 'src/content/posts');

export type PostFrontmatter = {
  title: string;
  description: string;
  date: string;
  slug: string;
  author: string;
  keywords: string[];
  topic: string;
  relatedCities: string[];
  relatedPosts: string[];
};

export type Post = PostFrontmatter & {
  contentMarkdown: string;
};

export type RenderedPost = PostFrontmatter & {
  contentHtml: string;
  toc: { id: string; text: string }[];
};

function readPostFile(filename: string): Post {
  const filePath = resolve(POSTS_DIR, filename);
  const raw = readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  const fm = data as Partial<PostFrontmatter>;
  return {
    title: fm.title ?? 'Untitled',
    description: fm.description ?? '',
    date: fm.date ?? new Date().toISOString().slice(0, 10),
    slug: fm.slug ?? filename.replace(/\.md$/, ''),
    author: fm.author ?? 'LaserHairNearMe Editorial',
    keywords: fm.keywords ?? [],
    topic: fm.topic ?? 'General',
    relatedCities: fm.relatedCities ?? [],
    relatedPosts: fm.relatedPosts ?? [],
    contentMarkdown: content,
  };
}

export function getAllPosts(): Post[] {
  let files: string[];
  try {
    files = readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
  } catch {
    return [];
  }
  return files
    .map(readPostFile)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostSlugs(): string[] {
  try {
    return readdirSync(POSTS_DIR)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''));
  } catch {
    return [];
  }
}

export function getPostBySlug(slug: string): Post | null {
  const safe = slug.replace(/[^a-z0-9-]/gi, '');
  try {
    return readPostFile(`${safe}.md`);
  } catch {
    return null;
  }
}

export function getPostsByTopic(): { topic: string; posts: Post[] }[] {
  const posts = getAllPosts();
  const groups = new Map<string, Post[]>();
  for (const p of posts) {
    if (!groups.has(p.topic)) groups.set(p.topic, []);
    groups.get(p.topic)!.push(p);
  }
  // Preferred order of topic sections on the index page
  const order = ['Cost & Pricing', 'Treatment Guides', 'Aftercare & Preparation', 'Comparisons'];
  return [...groups.entries()]
    .sort((a, b) => {
      const ai = order.indexOf(a[0]);
      const bi = order.indexOf(b[0]);
      if (ai === -1 && bi === -1) return a[0].localeCompare(b[0]);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })
    .map(([topic, posts]) => ({ topic, posts }));
}

export function getPostsForCity(citySlug: string): Post[] {
  return getAllPosts().filter((p) => p.relatedCities.includes(citySlug));
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export async function renderPost(post: Post): Promise<RenderedPost> {
  const processed = await remark()
    .use(html, { sanitize: false })
    .process(post.contentMarkdown);
  let contentHtml = processed.toString();

  // Inject id attributes onto h2 elements so the TOC can jump
  const usedIds = new Set<string>();
  contentHtml = contentHtml.replace(/<h2>([^<]+)<\/h2>/g, (_match, text: string) => {
    let id = slugifyHeading(text);
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${slugifyHeading(text)}-${suffix++}`;
    }
    usedIds.add(id);
    return `<h2 id="${id}">${text}</h2>`;
  });

  // Build a TOC from the same H2s in document order
  const tocSeen = new Set<string>();
  const toc: { id: string; text: string }[] = [];
  const h2Re = /<h2 id="([^"]+)">([^<]+)<\/h2>/g;
  let m: RegExpExecArray | null;
  while ((m = h2Re.exec(contentHtml)) !== null) {
    if (!tocSeen.has(m[1])) {
      tocSeen.add(m[1]);
      toc.push({ id: m[1], text: m[2] });
    }
  }

  return {
    title: post.title,
    description: post.description,
    date: post.date,
    slug: post.slug,
    author: post.author,
    keywords: post.keywords,
    topic: post.topic,
    relatedCities: post.relatedCities,
    relatedPosts: post.relatedPosts,
    contentHtml,
    toc,
  };
}
