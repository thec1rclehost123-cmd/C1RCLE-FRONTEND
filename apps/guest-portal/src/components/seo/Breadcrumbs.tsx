import Link from 'next/link';

import { absoluteClientUrl } from '@/lib/seo/client-site';
import { JsonLd } from '@/lib/seo/json-ld';

export interface BreadcrumbItem {
  readonly label: string;
  readonly href: string;
}

export function Breadcrumbs({ items }: { readonly items: readonly BreadcrumbItem[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: absoluteClientUrl(item.href),
    })),
  };

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="mb-5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45"
      >
        <ol className="flex flex-wrap items-center gap-2">
          {items.map((item, index) => (
            <li key={item.href} className="flex items-center gap-2">
              {index === items.length - 1 ? (
                <span aria-current="page" className="text-white/70">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="transition-colors hover:text-white">
                  {item.label}
                </Link>
              )}
              {index < items.length - 1 && <span aria-hidden="true">/</span>}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={data} />
    </>
  );
}
