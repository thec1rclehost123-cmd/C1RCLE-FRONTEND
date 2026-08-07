import Link from 'next/link';

import type { ProfileSection } from '../types/profile.types';

const sections: readonly { href: string; label: string; value: ProfileSection }[] = [
  { href: '/profile', label: 'Overview', value: 'overview' },
  { href: '/profile?view=events', label: 'Events', value: 'events' },
  { href: '/profile?view=settings', label: 'Settings', value: 'settings' },
];

export function ProfileSectionNav({ activeSection }: { activeSection: ProfileSection }) {
  return (
    <nav
      aria-label="Profile sections"
      className="flex w-full gap-2 overflow-x-auto rounded-full border border-white/10 bg-black/70 p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:w-fit"
    >
      {sections.map((section) => {
        const active = section.value === activeSection;
        return (
          <Link
            key={section.value}
            href={section.href}
            aria-current={active ? 'page' : undefined}
            className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-6 text-[10px] font-black uppercase tracking-[0.22em] transition-colors sm:flex-none ${
              active
                ? 'bg-[#FF4400] text-white'
                : 'text-white/45 hover:bg-white/10 hover:text-white'
            }`}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
