export interface HomeHeroContent {
  eyebrow: string;
  title: string;
  tagline: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  desktopVideoSrc: string;
  mobileVideoSrc: string;
  desktopPosterSrc: string;
  mobilePosterSrc: string;
}

export interface HomeFeaturedContent {
  eyebrow: string;
  title: string;
  highlightedWord: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface HomeFeaturedDropsContent {
  eyebrow: string;
  title: string;
  description: string;
  eventCtaLabel: string;
}

export interface HomeFixture {
  hero: HomeHeroContent;
  drops: HomeFeaturedDropsContent;
  featured: HomeFeaturedContent;
}
