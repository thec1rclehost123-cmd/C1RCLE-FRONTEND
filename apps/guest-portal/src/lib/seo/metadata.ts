import 'server-only';

import { absoluteUrl, getSiteUrl, isProductionSeo } from './site';

import type { Metadata } from 'next';

const SITE_NAME = 'THE C1RCLE';
const DEFAULT_IMAGE_PATH = '/c1rcle-logo.webp';

interface PublicMetadataInput {
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly image?: string | null;
  readonly type?: 'website' | 'article';
  readonly indexable?: boolean;
}

export function brandedTitle(title: string): string {
  return title === SITE_NAME || title.startsWith(`${SITE_NAME} |`)
    ? title
    : `${title} | ${SITE_NAME}`;
}

export function publicRobots(indexable = true): Metadata['robots'] {
  const allowIndexing = isProductionSeo() && indexable;
  return {
    index: allowIndexing,
    follow: allowIndexing,
    noarchive: !allowIndexing,
    nocache: !allowIndexing,
  };
}

export function privateRobots(): Metadata['robots'] {
  return { index: false, follow: true, noarchive: true, nocache: true };
}

export function buildPublicMetadata({
  path,
  title,
  description,
  image,
  type = 'website',
  indexable = true,
}: PublicMetadataInput): Metadata {
  const canonicalUrl = new URL(absoluteUrl(path));
  canonicalUrl.search = '';
  canonicalUrl.hash = '';
  const canonical = canonicalUrl.toString();
  const socialImage = image === null ? null : absoluteUrl(image ?? DEFAULT_IMAGE_PATH);
  const resolvedTitle = brandedTitle(title);

  return {
    title: { absolute: resolvedTitle },
    description,
    alternates: { canonical },
    robots: publicRobots(indexable),
    openGraph: {
      title: resolvedTitle,
      description,
      type,
      url: canonical,
      siteName: SITE_NAME,
      locale: 'en_IN',
      ...(socialImage === null ? {} : { images: [{ url: socialImage, alt: resolvedTitle }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedTitle,
      description,
      ...(socialImage === null ? {} : { images: [socialImage] }),
    },
  };
}

export function buildPrivateMetadata(title: string, description: string): Metadata {
  return {
    title: { absolute: brandedTitle(title) },
    description,
    robots: privateRobots(),
  };
}

export function getMetadataBase(): URL {
  return getSiteUrl();
}
