// FIXTURE_ONLY: Temporary UI development footer.

import Link from 'next/link';

export interface FooterLinkItem {
  label: string;
  href: string;
}

export const footerLinks: FooterLinkItem[] = [
  { label: 'Download App', href: '/app' },
  { label: 'Explore', href: '/explore' },
  { label: 'About', href: '/about' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
];

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/8 bg-[#080808] px-6 pb-28 pt-14 text-white lg:pb-14">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-6 text-center">
        <Link
          href="/"
          className="text-lg font-black uppercase tracking-[-0.04em] text-white transition-colors hover:text-white/75"
        >
          THE C1RCLE
        </Link>
        <p className="max-w-sm text-xs leading-5 text-white/40">
          Discover life offline. Find real events, venues, and hosts.
        </p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <p className="text-[10px] text-white/30">© 2026 THE C1RCLE</p>
      </div>
    </footer>
  );
}
