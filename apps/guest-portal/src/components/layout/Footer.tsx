// FIXTURE_ONLY: Temporary UI development footer.

import Link from 'next/link';

export interface FooterLinkItem {
  label: string;
  href: string;
}

export const footerLinks: FooterLinkItem[] = [
  { label: 'Download App', href: '/app' },
  { label: 'Explore', href: '/explore' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
];

export function Footer() {
  return (
    <footer className="bg-black text-white pt-20 md:pt-28 pb-24 md:pb-12 px-6 border-t border-white/10 relative z-10">
      <div className="max-w-[1400px] mx-auto flex flex-col items-center">
        {/* Giant Brand Typography */}
        <div className="relative mb-20 w-full text-center">
          <Link href="/" className="inline-block group">
            <h2 className="text-[14vw] md:text-[10rem] font-black uppercase tracking-tighter text-white/15 group-hover:text-white/30 transition-all duration-700 select-none">
              THE C1RCLE
            </h2>
          </Link>
        </div>

        {/* Bottom Navigation Links & Copyright */}
        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-8 pt-8 border-t border-white/10">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">
            © 2026 THE C1RCLE — DISCOVER LIFE OFFLINE
          </p>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
