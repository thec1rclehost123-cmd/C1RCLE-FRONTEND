import Image from 'next/image';

import type { ReactNode } from 'react';

/* ─────────────── Shared Utilities ─────────────── */

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pt-3 pb-1">
      <span className="text-[11px] font-semibold text-white/80">22:48</span>
      <div className="flex items-center gap-1.5">
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <rect x="0" y="4" width="3" height="7" rx="0.8" fill="white" fillOpacity="0.5" />
          <rect x="4.5" y="2.5" width="3" height="8.5" rx="0.8" fill="white" fillOpacity="0.5" />
          <rect x="9" y="0.5" width="3" height="10.5" rx="0.8" fill="white" fillOpacity="0.7" />
          <rect x="13.5" y="0" width="3" height="11" rx="0.8" fill="white" fillOpacity="0.9" />
        </svg>
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
          <path
            d="M7 0C4.24 0 1.73 1.11 0 2.83L7 10l7-7.17A9.97 9.97 0 007 0z"
            fill="white"
            fillOpacity="0.7"
          />
        </svg>
        <div className="flex items-center">
          <div className="h-[9px] w-[18px] rounded-[2.5px] border border-white/40 p-[1.5px]">
            <div className="h-full w-[70%] rounded-[1px] bg-white/80" />
          </div>
        </div>
      </div>
    </div>
  );
}

const screenGlowClasses = {
  gold: 'bg-[radial-gradient(ellipse_80%_50%_at_50%_-5%,rgba(245,158,11,0.20),transparent_60%)]',
  orange: 'bg-[radial-gradient(ellipse_80%_50%_at_50%_-5%,rgba(244,74,34,0.28),transparent_60%)]',
  orangeSoft:
    'bg-[radial-gradient(ellipse_80%_50%_at_50%_-5%,rgba(244,74,34,0.18),transparent_60%)]',
  pink: 'bg-[radial-gradient(ellipse_80%_50%_at_50%_-5%,rgba(236,72,153,0.22),transparent_60%)]',
  purple: 'bg-[radial-gradient(ellipse_80%_50%_at_50%_-5%,rgba(168,85,247,0.18),transparent_60%)]',
} as const;

function ScreenShell({
  children,
  className = '',
  glow = 'orange',
}: {
  children: ReactNode;
  className?: string;
  glow?: keyof typeof screenGlowClasses;
}) {
  return (
    <div className={`absolute inset-0 overflow-hidden bg-[#060606] text-white ${className}`}>
      <div className={`absolute inset-0 ${screenGlowClasses[glow]}`} />
      <div className="nightlife-grain absolute inset-0 opacity-[0.06]" />
      <div className="relative z-10 h-full flex flex-col">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Screen 1: DISCOVER — Premium Nightlife Discovery
   ═══════════════════════════════════════════════════════════════ */
export function DiscoveryFeedScreen() {
  const filters = ['Tonight', 'Guestlist', 'VIP', 'Rooftop', 'Techno'];

  return (
    <ScreenShell glow="orange">
      <StatusBar />

      {/* Header */}
      <div className="px-5 pt-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-[#ff6b4a]/90">
          Tonight
        </p>
        <h3 className="mt-1.5 font-heading text-[26px] font-black uppercase leading-[0.95] tracking-tight">
          Find your
          <br />
          room
        </h3>
      </div>

      {/* Search Bar */}
      <div className="mx-5 mt-3.5">
        <div className="flex items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 backdrop-blur-xl">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <span className="text-[11px] font-medium text-white/25">
            Search events, music, venues
          </span>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="discovery-filter-chips mt-3 flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-none">
        {filters.map((f, i) => (
          <span
            key={f}
            className={`shrink-0 rounded-full px-3.5 py-[6px] text-[9px] font-bold uppercase tracking-[0.12em] transition-all ${
              i === 0
                ? 'bg-gradient-to-r from-[#F44A22] to-[#FF6B4A] text-white shadow-[0_0_16px_rgba(244,74,34,0.4)]'
                : 'border border-white/[0.10] bg-white/[0.04] text-white/50'
            }`}
          >
            {f}
          </span>
        ))}
      </div>

      {/* Scrollable Content */}
      <div className="discovery-feed-stack mt-3 flex-1 overflow-y-auto px-4 pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="discovery-feed-inner space-y-3">
          {/* Featured Event Card */}
          <div className="relative overflow-hidden rounded-[24px] border border-white/[0.10] shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
            {/* Event Image */}
            <div className="relative h-[180px] w-full overflow-hidden">
              <Image
                src="/home/phone/nightclub-featured.webp"
                alt="Nightclub event"
                fill
                className="object-cover"
                sizes="(max-width: 400px) 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              {/* Guestlist Pill */}
              <div className="absolute left-3.5 top-3.5">
                <span className="rounded-full bg-[#F44A22] px-3 py-[5px] text-[8px] font-black uppercase tracking-[0.14em] text-white shadow-[0_0_14px_rgba(244,74,34,0.5)]">
                  Guestlist Open
                </span>
              </div>
              {/* Social Proof */}
              <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5">
                <div className="flex -space-x-2">
                  {[
                    'bg-gradient-to-br from-[#F44A22]/80 to-[#F44A22]/40',
                    'bg-gradient-to-br from-[#8b5cf6]/80 to-[#8b5cf6]/40',
                    'bg-gradient-to-br from-[#ec4899]/80 to-[#ec4899]/40',
                  ].map((colorClass) => (
                    <div
                      key={colorClass}
                      className={`h-5 w-5 rounded-full border-[1.5px] border-black ${colorClass}`}
                    />
                  ))}
                </div>
                <span className="text-[9px] font-bold text-white/80">+72</span>
              </div>
              {/* Event Info overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/50">
                  EPITOME • Koregaon Park
                </p>
                <h4 className="mt-1 font-heading text-xl font-black uppercase leading-none tracking-tight">
                  House Night
                </h4>
                <p className="mt-1 text-[10px] font-medium text-white/45">
                  Deep house · intimate vibes · late night
                </p>
              </div>
            </div>
            {/* CTA Section */}
            <div className="flex items-center justify-between bg-white/[0.04] px-4 py-3 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22c55e]" />
                <span className="text-[9px] font-bold text-white/40">72 going tonight</span>
              </div>
              <button className="rounded-full bg-gradient-to-r from-[#F44A22] to-[#FF6B4A] px-4 py-[7px] text-[9px] font-black uppercase tracking-[0.16em] text-white shadow-[0_0_20px_rgba(244,74,34,0.35)]">
                Get on list
              </button>
            </div>
          </div>

          {/* Smaller Event Cards */}
          <div className="space-y-2.5">
            {/* Card 1 */}
            <div className="relative flex overflow-hidden rounded-[18px] border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl">
              <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden">
                <Image
                  src="/home/phone/rooftop-event.webp"
                  alt="Rooftop event"
                  fill
                  className="object-cover"
                  sizes="88px"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#060606]" />
              </div>
              <div className="flex flex-1 flex-col justify-center px-3.5 py-3">
                <div className="flex items-center gap-2">
                  <h5 className="font-heading text-[13px] font-black uppercase leading-none tracking-tight">
                    Skyline Sessions
                  </h5>
                </div>
                <p className="mt-1 text-[9px] font-medium text-white/35">
                  Rooftop · sunset to sunrise
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full bg-[#F44A22]/15 px-2.5 py-[3px] text-[8px] font-bold uppercase tracking-[0.1em] text-[#FF6B4A]">
                    Few spots left
                  </span>
                  <span className="text-[8px] font-bold text-white/25">41 going</span>
                </div>
              </div>
            </div>
            {/* Card 2 */}
            <div className="relative flex overflow-hidden rounded-[18px] border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl">
              <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden">
                <Image
                  src="/home/phone/techno-basement.webp"
                  alt="Techno event"
                  fill
                  className="object-cover"
                  sizes="88px"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#060606]" />
              </div>
              <div className="flex flex-1 flex-col justify-center px-3.5 py-3">
                <div className="flex items-center gap-2">
                  <h5 className="font-heading text-[13px] font-black uppercase leading-none tracking-tight">
                    Techno Basement
                  </h5>
                </div>
                <p className="mt-1 text-[9px] font-medium text-white/35">
                  Underground · raw energy
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full bg-[#8b5cf6]/15 px-2.5 py-[3px] text-[8px] font-bold uppercase tracking-[0.1em] text-[#a78bfa]">
                    VIP open
                  </span>
                  <span className="text-[8px] font-bold text-white/25">28 going</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Screen 2: INTERESTED LIST — Social Proof / Who's Going
   ═══════════════════════════════════════════════════════════════ */
export function InterestedPeopleScreen() {
  const people = [
    {
      name: 'Arya M.',
      status: 'Going',
      mutual: 3,
      photo: '/home/people/arya.webp',
      grad: 'from-[#F44A22] to-[#ff7b5a]',
    },
    {
      name: 'Rohan K.',
      status: 'Interested',
      mutual: 7,
      photo: '/home/people/rohan.webp',
      grad: 'from-[#8b5cf6] to-[#c084fc]',
    },
    {
      name: 'Priya S.',
      status: 'Going',
      mutual: 2,
      photo: '/home/people/priya.webp',
      grad: 'from-[#ec4899] to-[#f472b6]',
    },
    {
      name: 'Karan D.',
      status: 'Maybe',
      mutual: 5,
      photo: '/home/people/karan.webp',
      grad: 'from-[#22c55e] to-[#4ade80]',
    },
    {
      name: 'Sneha R.',
      status: 'Going',
      mutual: 4,
      photo: '/home/people/sneha.webp',
      grad: 'from-[#f59e0b] to-[#fbbf24]',
    },
  ] as const;

  const statusColors = {
    Going: 'bg-[#F44A22]/15 text-[#FF6B4A]',
    Interested: 'bg-[#8b5cf6]/15 text-[#a78bfa]',
    Maybe: 'bg-white/[0.08] text-white/40',
  } as const;

  return (
    <ScreenShell glow="purple">
      <StatusBar />

      {/* Header */}
      <div className="px-5 pt-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-[#c084fc]/80">
          Social Signal
        </p>
        <h3 className="mt-1.5 font-heading text-[26px] font-black uppercase leading-[0.95] tracking-tight">
          Who&apos;s
          <br />
          going
        </h3>
      </div>

      {/* Overlapping Avatars Row */}
      <div className="mt-4 flex items-center px-5">
        <div className="flex -space-x-3">
          {people.map((p) => (
            <div
              key={p.name}
              className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#0a0a0a] bg-gradient-to-br ${p.grad} shadow-lg overflow-hidden`}
            >
              <Image src={p.photo} alt={p.name} fill className="object-cover" sizes="40px" />
            </div>
          ))}
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#0a0a0a] bg-white/[0.08] text-[9px] font-bold text-white/50">
            +67
          </div>
        </div>
      </div>

      {/* Stats Summary Card */}
      <div className="mx-5 mt-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Friends', value: '8', sub: 'interested' },
            { label: 'Going', value: '34', sub: 'confirmed' },
            { label: 'Circle', value: '12', sub: 'from yours' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-[16px] border border-white/[0.08] bg-white/[0.04] p-3 text-center backdrop-blur-xl"
            >
              <p className="text-[16px] font-black text-white">{stat.value}</p>
              <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-white/30">
                {stat.sub}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* People List */}
      <div className="interested-people-stack mt-4 flex-1 space-y-2 overflow-y-auto px-5 pb-20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {people.map((p) => (
          <div
            key={p.name}
            className="relative flex items-center gap-3 overflow-hidden rounded-[18px] border border-white/[0.08] bg-white/[0.04] px-4 py-3 backdrop-blur-xl"
          >
            {/* Soft glow behind avatar */}
            <div
              className={`absolute -left-4 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full bg-gradient-to-r ${p.grad} opacity-20 blur-2xl`}
            />
            <div
              className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${p.grad} overflow-hidden border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]`}
            >
              <Image src={p.photo} alt={p.name} fill className="object-cover" sizes="40px" />
            </div>
            <div className="relative z-10 flex-1 min-w-0">
              <p className="text-[12px] font-bold text-white truncate">{p.name}</p>
              <p className="text-[9px] font-medium text-white/30">{p.mutual} mutual friends</p>
            </div>
            <span
              className={`relative z-10 rounded-full px-2.5 py-[4px] text-[8px] font-bold uppercase tracking-[0.1em] ${statusColors[p.status]}`}
            >
              {p.status}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#060606] via-[#060606]/95 to-transparent px-5 pb-5 pt-8">
        <button className="w-full rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] py-3.5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[0_0_30px_rgba(139,92,246,0.3)]">
          Ask the group
        </button>
      </div>
    </ScreenShell>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Screen 3: ASK OUT — Social Connection / Make Your Move
   ═══════════════════════════════════════════════════════════════ */
export function AskOutScreen() {
  const interests = ['Deep House', 'Late nights', 'Rooftops', 'Cocktails', 'Art'];

  return (
    <ScreenShell glow="pink">
      <StatusBar />

      {/* Header */}
      <div className="px-5 pt-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-[#f472b6]/80">
          Connect
        </p>
        <h3 className="mt-1.5 font-heading text-[26px] font-black uppercase leading-[0.95] tracking-tight">
          Make your
          <br />
          move
        </h3>
      </div>

      {/* Hero Profile Card */}
      <div className="ask-out-content mx-5 mt-4">
        <div className="relative overflow-hidden rounded-[26px] border border-white/[0.10] bg-white/[0.04] p-5 backdrop-blur-2xl">
          {/* Glow */}
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#ec4899]/20 blur-3xl" />
          <div className="absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-[#F44A22]/15 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Large Circular Avatar */}
            <div className="relative">
              <div className="relative flex h-[80px] w-[80px] items-center justify-center rounded-full shadow-[0_0_40px_rgba(236,72,153,0.3)] border-[2.5px] border-[#ec4899]/50 overflow-hidden">
                <Image
                  src="/home/people/arya.webp"
                  alt="Arya M."
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              {/* Online dot */}
              <div className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-[#0a0a0a] bg-[#22c55e]" />
            </div>

            <h4 className="mt-3.5 font-heading text-xl font-black uppercase tracking-tight">
              Arya M.
            </h4>
            <p className="mt-1 text-[10px] font-medium text-white/40">Also going to House Night</p>

            {/* Vibe Match */}
            <div className="mt-3 flex items-center gap-2 rounded-full border border-[#ec4899]/20 bg-[#ec4899]/[0.08] px-4 py-2">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="#ec4899"
                className="drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span className="text-[11px] font-black text-[#f472b6]">89% vibe match</span>
            </div>
          </div>
        </div>

        {/* Interest Chips */}
        <div className="mt-3 flex flex-wrap gap-2 justify-center">
          {interests.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-[5px] text-[8px] font-bold uppercase tracking-[0.12em] text-white/45"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Primary CTA */}
        <button className="mt-4 w-full rounded-2xl bg-gradient-to-r from-[#ec4899] to-[#F44A22] py-3.5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[0_0_30px_rgba(236,72,153,0.35)]">
          Ask to go together
        </button>

        {/* Secondary Actions */}
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <button className="rounded-[16px] border border-white/[0.08] bg-white/[0.04] py-3 text-center text-[9px] font-bold uppercase tracking-[0.14em] text-white/50 backdrop-blur-xl">
            Start chat
          </button>
          <button className="rounded-[16px] border border-white/[0.08] bg-white/[0.04] py-3 text-center text-[9px] font-bold uppercase tracking-[0.14em] text-white/50 backdrop-blur-xl">
            Send event
          </button>
        </div>

        {/* Tonight's Plan Mini Card */}
        <div className="mt-3 flex items-center gap-3 rounded-[16px] border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#F44A22]/15">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FF6B4A"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-white/70">Tonight&apos;s plan</p>
            <p className="text-[8px] font-medium text-white/30">House Night · EPITOME · 11PM</p>
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Screen 4: TICKETS — Premium Ticket Wallet
   ═══════════════════════════════════════════════════════════════ */
export function TicketActionsScreen() {
  return (
    <ScreenShell glow="orange">
      <StatusBar />

      {/* Header */}
      <div className="px-5 pt-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-[#ff6b4a]/90">
          Your Night
        </p>
        <h3 className="mt-1.5 font-heading text-[26px] font-black uppercase leading-[0.95] tracking-tight">
          Ticket
          <br />
          wallet
        </h3>
      </div>

      {/* Main Ticket Card */}
      <div className="ticket-actions-content mx-5 mt-4">
        <div className="relative overflow-hidden rounded-[24px] border border-[#F44A22]/20 bg-[#0c0a08] p-[1px]">
          {/* Glowing edge */}
          <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-[#F44A22]/30 via-transparent to-[#ff8c42]/20 opacity-70" />
          <div className="relative rounded-[23px] bg-[#0c0a08] p-5">
            {/* Top row */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">
                  Event
                </p>
                <h4 className="mt-1 font-heading text-lg font-black uppercase tracking-tight">
                  House Night
                </h4>
                <p className="mt-0.5 text-[10px] font-medium text-white/35">Guestlist + Cover</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">
                  Price
                </p>
                <p className="mt-1 text-lg font-black text-[#FF6B4A]">₹799</p>
              </div>
            </div>

            {/* Dashed Separator */}
            <div className="my-4 border-t border-dashed border-white/[0.10]" />

            {/* QR Code Area */}
            <div className="flex items-center gap-4">
              <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[14px] bg-white p-1.5 shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                {/* Realistic QR Pattern */}
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 21 21"
                  shapeRendering="crispEdges"
                  fill="black"
                >
                  <path d="M0,0 h7 v7 h-7 z M1,1 v5 h5 v-5 z M2,2 h3 v3 h-3 z M14,0 h7 v7 h-7 z M15,1 v5 h5 v-5 z M16,2 h3 v3 h-3 z M0,14 h7 v7 h-7 z M1,15 v5 h5 v-5 z M2,16 h3 v3 h-3 z" />
                  <path d="M8,0 h1 v2 h-1 z M10,0 h1 v1 h-1 z M12,0 h1 v1 h-1 z M9,1 h1 v1 h-1 z M11,1 h2 v1 h-2 z M7,2 h2 v1 h-2 z M10,2 h1 v1 h-1 z M12,2 h2 v1 h-2 z M8,3 h1 v1 h-1 z M10,3 h1 v2 h-1 z M13,3 h1 v1 h-1 z" />
                  <path d="M7,4 h2 v1 h-2 z M11,4 h2 v1 h-2 z M8,5 h1 v1 h-1 z M10,5 h1 v1 h-1 z M12,5 h2 v1 h-2 z M7,6 h1 v1 h-1 z M9,6 h1 v1 h-1 z M11,6 h1 v2 h-1 z M13,6 h1 v1 h-1 z" />
                  <path d="M0,8 h2 v1 h-2 z M3,8 h1 v1 h-1 z M5,8 h3 v1 h-3 z M9,8 h2 v1 h-2 z M12,8 h2 v1 h-2 z M15,8 h1 v1 h-1 z M17,8 h1 v1 h-1 z M19,8 h2 v1 h-2 z" />
                  <path d="M1,9 h1 v2 h-1 z M3,9 h2 v1 h-2 z M6,9 h1 v1 h-1 z M8,9 h1 v1 h-1 z M10,9 h1 v1 h-1 z M14,9 h2 v1 h-2 z M17,9 h1 v2 h-1 z M19,9 h1 v1 h-1 z" />
                  <path d="M0,10 h1 v1 h-1 z M3,10 h1 v2 h-1 z M5,10 h2 v1 h-2 z M8,10 h1 v2 h-1 z M10,10 h3 v1 h-3 z M14,10 h2 v1 h-2 z M19,10 h2 v1 h-2 z" />
                  <path d="M0,11 h3 v1 h-3 z M5,11 h2 v1 h-2 z M10,11 h2 v1 h-2 z M13,11 h1 v1 h-1 z M15,11 h2 v1 h-2 z M18,11 h1 v1 h-1 z M20,11 h1 v1 h-1 z" />
                  <path d="M0,12 h1 v1 h-1 z M2,12 h1 v1 h-1 z M4,12 h1 v1 h-1 z M6,12 h2 v1 h-2 z M9,12 h3 v1 h-3 z M13,12 h1 v1 h-1 z M15,12 h1 v1 h-1 z M17,12 h3 v1 h-3 z" />
                  <path d="M7,13 h1 v1 h-1 z M9,13 h1 v2 h-1 z M11,13 h1 v1 h-1 z M13,13 h2 v2 h-2 z M16,13 h1 v1 h-1 z M18,13 h1 v1 h-1 z M20,13 h1 v1 h-1 z" />
                  <path d="M7,14 h1 v1 h-1 z M11,14 h1 v1 h-1 z M16,14 h2 v1 h-2 z M19,14 h2 v1 h-2 z M8,15 h1 v1 h-1 z M10,15 h2 v1 h-2 z M13,15 h2 v1 h-2 z M16,15 h1 v1 h-1 z M18,15 h1 v1 h-1 z M20,15 h1 v1 h-1 z" />
                  <path d="M7,16 h2 v1 h-2 z M10,16 h1 v1 h-1 z M12,16 h1 v1 h-1 z M15,16 h3 v1 h-3 z M19,16 h1 v1 h-1 z M8,17 h1 v1 h-1 z M10,17 h2 v1 h-2 z M13,17 h1 v1 h-1 z M16,17 h1 v1 h-1 z M18,17 h3 v1 h-3 z" />
                  <path d="M7,18 h1 v1 h-1 z M9,18 h2 v1 h-2 z M12,18 h2 v1 h-2 z M15,18 h2 v1 h-2 z M18,18 h1 v1 h-1 z M20,18 h1 v1 h-1 z M8,19 h2 v1 h-2 z M11,19 h1 v1 h-1 z M13,19 h1 v1 h-1 z M15,19 h1 v1 h-1 z M17,19 h1 v1 h-1 z" />
                  <path d="M7,20 h2 v1 h-2 z M10,20 h1 v1 h-1 z M12,20 h1 v1 h-1 z M14,20 h3 v1 h-3 z M18,20 h3 v1 h-3 z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#22c55e]/80">
                    Valid
                  </p>
                </div>
                <p className="mt-1 text-[10px] font-medium text-white/35">Tonight, 10 PM onwards</p>
                <p className="mt-0.5 text-[9px] font-medium text-white/20">
                  EPITOME · Koregaon Park
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            {
              icon: (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              ),
              label: 'Buy',
              glow: true,
            },
            {
              icon: (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              ),
              label: 'Share',
              glow: false,
            },
            {
              icon: (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              ),
              label: 'Transfer',
              glow: false,
            },
          ].map((action) => (
            <button
              key={action.label}
              className={`flex flex-col items-center gap-1.5 rounded-[18px] border py-3.5 backdrop-blur-xl ${
                action.glow
                  ? 'border-[#F44A22]/20 bg-[#F44A22]/[0.08] shadow-[0_0_16px_rgba(244,74,34,0.15)] text-[#FF6B4A]'
                  : 'border-white/[0.08] bg-white/[0.04] text-white/50'
              }`}
            >
              <div className="text-current flex items-center justify-center mb-0.5">
                {action.icon}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-[0.14em] text-current`}>
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {/* Transfer Panel */}
        <div className="mt-3 rounded-[18px] border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-xl">
          <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/30">
            Transfer to
          </p>
          <div className="mt-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#c084fc] shadow-[0_0_15px_rgba(139,92,246,0.3)] border-[1.5px] border-[#8b5cf6]/40 overflow-hidden">
                <Image
                  src="/home/people/rohan.webp"
                  alt="Rohan K."
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              </div>
              <p className="text-[11px] font-bold">Rohan K.</p>
            </div>
            <button className="rounded-full bg-white/[0.10] px-3.5 py-[6px] text-[9px] font-bold uppercase tracking-[0.12em] text-white/70">
              Confirm
            </button>
          </div>
        </div>

        {/* Bottom CTA */}
        <button className="mt-3 w-full rounded-2xl bg-white py-3.5 text-center text-[10px] font-black uppercase tracking-[0.18em] text-black">
          Buy another ticket
        </button>
      </div>
    </ScreenShell>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Screen 5: CHATS — Event-Only Group Chat
   ═══════════════════════════════════════════════════════════════ */
export function GroupChatScreen() {
  const messages = [
    { sender: 'Friend 1', text: 'What time are we getting there?', time: '10:12 PM', isMe: false },
    {
      sender: 'You',
      text: "Let's aim for 11. Skip the early crowd 😏",
      time: '10:14 PM',
      isMe: true,
    },
    {
      sender: 'Friend 2',
      text: 'Someone get on the guestlist fast',
      time: '10:15 PM',
      isMe: false,
    },
    { sender: 'Friend 3', text: 'Already did 💅 see you inside', time: '10:16 PM', isMe: false },
    { sender: 'You', text: 'W. Meet at the entrance?', time: '10:17 PM', isMe: true },
  ];

  return (
    <ScreenShell glow="orangeSoft">
      <StatusBar />

      {/* Chat Header */}
      <div className="border-b border-white/[0.06] px-5 pb-3 pt-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F44A22]/60 to-[#8b5cf6]/40 shadow-[0_0_15px_rgba(244,74,34,0.3)]">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-heading text-[14px] font-black uppercase leading-none tracking-tight">
              House Night Chat
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[8px] font-medium text-white/35">72 people</span>
              <span className="rounded-full bg-[#F44A22]/12 px-2 py-[2px] text-[7px] font-bold uppercase tracking-[0.1em] text-[#FF6B4A]">
                Event only
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pinned Event Card */}
      <div className="mx-4 mt-3">
        <div className="flex items-center gap-3 rounded-[14px] border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 backdrop-blur-xl">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#F44A22]/15">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FF6B4A"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-white/60 truncate">
              House Night · EPITOME · 10PM
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-[#F44A22]/15 px-2 py-[2px] text-[7px] font-bold uppercase text-[#FF6B4A]">
            Tonight
          </span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="group-chat-messages mt-3 flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 pb-20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
            {!msg.isMe && (
              <p className="mb-1 px-1 text-[8px] font-bold uppercase tracking-[0.16em] text-white/25">
                {msg.sender}
              </p>
            )}
            <div
              className={`max-w-[78%] rounded-[16px] px-3.5 py-2.5 ${
                msg.isMe
                  ? 'bg-gradient-to-r from-[#F44A22] to-[#ff6b3d] text-white shadow-[0_4px_16px_rgba(244,74,34,0.25)]'
                  : 'border border-white/[0.08] bg-white/[0.05] backdrop-blur-xl'
              }`}
            >
              <p className="text-[11px] font-medium leading-snug">{msg.text}</p>
            </div>
            <p className="mt-0.5 px-1 text-[7px] font-medium text-white/15">{msg.time}</p>
          </div>
        ))}
      </div>

      {/* Message Composer */}
      <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/[0.06] bg-[#080808]/95 px-4 py-3 backdrop-blur-2xl">
        <div className="flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2.5">
          <p className="flex-1 text-[11px] font-medium text-white/25">Type a message...</p>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-[#F44A22] to-[#FF6B4A] shadow-[0_0_12px_rgba(244,74,34,0.3)]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Screen 6: PASSES — VIP Priority Passes (Elite / Gold)
   ═══════════════════════════════════════════════════════════════ */
export function PriorityPassScreen() {
  const perks = [
    {
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ),
      label: 'Instant entry',
      desc: 'No wait',
    },
    {
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      label: 'Premium access',
      desc: 'VIP areas',
    },
    {
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
      ),
      label: 'Host support',
      desc: 'Concierge',
    },
    {
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      label: 'Priority queue',
      desc: 'Always first',
    },
  ];

  return (
    <ScreenShell glow="gold">
      <StatusBar />

      {/* Header */}
      <div className="px-5 pt-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-[#fbbf24]/80">
          VIP Access
        </p>
        <h3 className="mt-1.5 font-heading text-[26px] font-black uppercase leading-[0.95] tracking-tight">
          Skip the
          <br />
          line
        </h3>
      </div>

      {/* Hero Pass Card */}
      <div className="priority-pass-content mx-5 mt-4">
        <div className="relative overflow-hidden rounded-[28px] border border-[#f59e0b]/25 bg-[#0e0c06] p-[1px]">
          {/* Gold glow border */}
          <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-[#f59e0b]/30 via-transparent to-[#F44A22]/20 opacity-80" />

          <div className="relative rounded-[27px] bg-gradient-to-br from-[#0e0c06] via-[#12100a] to-[#0e0c06] p-6">
            {/* Ambient glows */}
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#f59e0b]/15 blur-3xl" />
            <div className="absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-[#F44A22]/10 blur-3xl" />

            <div className="relative z-10">
              {/* Top Labels */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 rounded-full border border-[#f59e0b]/25 bg-[#f59e0b]/[0.12] px-3 py-[5px] text-[8px] font-black uppercase tracking-[0.14em] text-[#fbbf24] shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 22h20v-2H2v2zm9.35-15.65l-2.8 2.8L4 5l2 11h12l2-11-4.55 4.15-2.8-2.8c-.8-.8-2.5-.8-3.3 0z" />
                  </svg>{' '}
                  VIP Pass
                </span>
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#f59e0b]/50">
                  Priority #1
                </p>
              </div>

              {/* Crown Icon */}
              <div className="mt-5 flex flex-col items-center text-center">
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-[#f59e0b]/25 bg-gradient-to-br from-[#f59e0b]/20 to-[#F44A22]/10 shadow-[0_0_50px_rgba(245,158,11,0.25)] text-[#fbbf24]">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 22h20v-2H2v2zm9.35-15.65l-2.8 2.8L4 5l2 11h12l2-11-4.55 4.15-2.8-2.8c-.8-.8-2.5-.8-3.3 0z" />
                  </svg>
                </div>
                <h4 className="mt-3.5 font-heading text-xl font-black uppercase tracking-tight">
                  Priority Access
                </h4>
                <p className="mt-1 text-[10px] font-medium text-white/35">
                  Walk straight in, zero wait time
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Perks Grid */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {perks.map((perk) => (
            <div
              key={perk.label}
              className="flex items-center gap-2.5 rounded-[16px] border border-[#f59e0b]/10 bg-[#f59e0b]/[0.04] px-3.5 py-3 backdrop-blur-xl"
            >
              <span className="text-[#fbbf24]">{perk.icon}</span>
              <div>
                <p className="text-[10px] font-bold text-white/70">{perk.label}</p>
                <p className="text-[8px] font-medium text-white/25">{perk.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button className="mt-4 w-full rounded-2xl bg-gradient-to-r from-[#f59e0b] to-[#F44A22] py-3.5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-black shadow-[0_0_36px_rgba(245,158,11,0.3)]">
          Get priority pass
        </button>
      </div>
    </ScreenShell>
  );
}
