import {
  Playfair_Display,
  Great_Vibes,
  DotGothic16,
  Lora,
  Anton,
  Space_Grotesk,
  Bebas_Neue,
} from 'next/font/google';

const eclectic = Playfair_Display({
  subsets: ['latin'],
  weight: '700',
  display: 'swap',
  variable: '--event-font-eclectic',
  preload: false,
});
const fancy = Great_Vibes({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--event-font-fancy',
  preload: false,
});
const digital = DotGothic16({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--event-font-digital',
  preload: false,
});
const literary = Lora({
  subsets: ['latin'],
  weight: '600',
  display: 'swap',
  variable: '--event-font-literary',
  preload: false,
});
const impact = Anton({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--event-font-impact',
  preload: false,
});
const modern = Space_Grotesk({
  subsets: ['latin'],
  weight: '700',
  display: 'swap',
  variable: '--event-font-modern',
  preload: false,
});
const condensed = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--event-font-condensed',
  preload: false,
});
export const eventTitleFontVariables = [
  eclectic.variable,
  fancy.variable,
  digital.variable,
  literary.variable,
  impact.variable,
  modern.variable,
  condensed.variable,
].join(' ');
