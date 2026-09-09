import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'THE C1RCLE',
    short_name: 'C1RCLE',
    description: 'Discover events and experiences with THE C1RCLE.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/c1rcle-logo.webp',
        sizes: '128x128',
        type: 'image/webp',
      },
    ],
  };
}
