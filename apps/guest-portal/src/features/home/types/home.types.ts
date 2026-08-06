export interface HomeHeroContent {
  eyebrow: string;
  title: string;
  tagline: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  videoSrc: string;
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

export interface HomeFixture {
  hero: HomeHeroContent;
  featured: HomeFeaturedContent;
}
