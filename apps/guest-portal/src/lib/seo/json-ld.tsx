import type { ReactNode } from 'react';

export type JsonLdValue = Record<string, unknown> | readonly Record<string, unknown>[];

export function serializeJsonLd(value: JsonLdValue): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function JsonLd({ data }: { readonly data: JsonLdValue }): ReactNode {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
