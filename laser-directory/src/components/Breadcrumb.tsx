import Link from 'next/link';
import { JsonLd } from './JsonLd';

export type BreadcrumbItem = { label: string; href: string };

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  baseUrl?: string;
};

export function Breadcrumb({ items, baseUrl = '' }: BreadcrumbProps) {
  if (items.length === 0) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: `${baseUrl}${item.href}`,
    })),
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-gray-600">
        <ol className="flex flex-wrap items-center gap-1">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={item.href} className="flex items-center gap-1">
                {i > 0 && <span aria-hidden="true" className="text-gray-400">/</span>}
                {isLast ? (
                  <span aria-current="page" className="text-gray-900">{item.label}</span>
                ) : (
                  <Link href={item.href} className="text-teal-600 hover:underline">
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={jsonLd} />
    </>
  );
}
