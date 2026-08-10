'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';

import type { HostDirectoryProfile, VenueDirectoryProfile } from '../types/directory.types';

const quickFilters = [
  'TABLES AVAILABLE',
  'KOREGAON PARK',
  'BANER',
  'VIMAN NAGAR',
  'KALYANI NAGAR',
  'FC ROAD',
  'HINJEWADI',
  'WAKAD',
  'SHIVAJINAGAR',
];

export function DirectoryLanding({
  hosts,
  venues,
}: {
  hosts: readonly HostDirectoryProfile[];
  venues: readonly VenueDirectoryProfile[];
}) {
  const [activeTab, setActiveTab] = useState<'venues' | 'hosts'>('venues');
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>('TABLES AVAILABLE');

  const filteredVenues = venues.filter((venue) => {
    const matchesSearch =
      venue.name.toLowerCase().includes(search.toLowerCase()) ||
      venue.address.toLowerCase().includes(search.toLowerCase()) ||
      venue.summary.toLowerCase().includes(search.toLowerCase());

    if (!selectedFilter || selectedFilter === 'TABLES AVAILABLE') return matchesSearch;
    return (
      matchesSearch &&
      (venue.address.toLowerCase().includes(selectedFilter.toLowerCase()) ||
        venue.city.toLowerCase().includes(selectedFilter.toLowerCase()))
    );
  });

  const filteredHosts = hosts.filter((host) => {
    return (
      host.name.toLowerCase().includes(search.toLowerCase()) ||
      host.role.toLowerCase().includes(search.toLowerCase()) ||
      host.city.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="relative z-10 min-h-screen overflow-x-clip px-4 pb-24 pt-24 text-white sm:px-6 lg:px-8">
      {/* Dark Ambient Backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#050505]">
        <div className="absolute inset-x-0 top-0 h-[46rem] bg-[radial-gradient(circle_at_50%_0%,rgba(255,68,0,0.18),transparent_60%)]" />
      </div>

      <div className="mx-auto max-w-[1440px]">
        {/* Top Navigation Back Arrow */}
        <div className="mb-6">
          <Link
            href="/"
            aria-label="Back to home"
            className="inline-flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-xl transition-colors hover:bg-white hover:text-black"
          >
            <span aria-hidden="true" className="text-lg">←</span>
          </Link>
        </div>

        {/* Hero Header Section */}
        <div className="flex flex-col items-center text-center">
          <h1 className="text-5xl font-black uppercase tracking-tight text-white sm:text-7xl lg:text-8xl">
            {activeTab === 'venues' ? 'DISCOVER VENUES' : 'DISCOVER HOSTS'}
          </h1>
          <p className="mt-4 max-w-2xl text-xs font-bold uppercase tracking-[0.22em] text-white/60 sm:text-sm">
            {activeTab === 'venues'
              ? "THE SPACES THAT SET THE PULSE. EXPLORE PUNE, IN'S FINEST CIRCUITS."
              : 'THE CREATORS, CURATORS, AND ORGANIZERS DRIVING THE CITY AFTER DARK.'}
          </p>

          {/* Sub-Tab Toggle Switch */}
          <div className="mt-8 inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur-2xl shadow-inner">
            <button
              type="button"
              onClick={() => {
                setActiveTab('venues');
              }}
              className={`rounded-full px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                activeTab === 'venues'
                  ? 'bg-white text-black shadow-md'
                  : 'text-white/60 hover:text-white font-bold'
              }`}
            >
              VENUES
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('hosts');
              }}
              className={`rounded-full px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                activeTab === 'hosts'
                  ? 'bg-white text-black shadow-md'
                  : 'text-white/60 hover:text-white font-bold'
              }`}
            >
              HOSTS
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-10 relative w-full max-w-5xl mx-auto">
          <div className="flex items-center gap-3.5 rounded-full border border-white/10 bg-white/[0.04] px-6 py-4 backdrop-blur-2xl transition-colors focus-within:border-white/25">
            <svg aria-hidden="true" className="size-5 shrink-0 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              placeholder={
                activeTab === 'venues'
                  ? 'Search venues by name, area, vibe...'
                  : 'Search hosts by name, role, city...'
              }
              className="w-full bg-transparent text-sm font-semibold text-white placeholder:text-white/35 outline-none sm:text-base"
            />
          </div>
        </div>

        {/* Quick Filter Pills Bar */}
        <div className="mt-6 flex items-center gap-3 overflow-x-auto pb-3 max-w-5xl mx-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setSelectedFilter(null);
            }}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shrink-0 hover:bg-white hover:text-black transition-colors"
          >
            <svg aria-hidden="true" className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="8" x2="16" y1="12" y2="12" />
              <line x1="10" x2="14" y1="18" y2="18" />
            </svg>
            FILTER
          </button>

          {quickFilters.map((filter) => {
            const isActive = selectedFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setSelectedFilter(isActive ? null : filter);
                }}
                className={`rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-widest shrink-0 transition-all ${
                  isActive
                    ? 'border border-[#FF4400] bg-[#FF4400]/20 text-[#FF6842] shadow-[0_0_20px_rgba(255,68,0,0.3)]'
                    : 'border border-white/10 bg-white/[0.04] text-white/60 hover:border-white/25 hover:text-white'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        {/* Cards Grid */}
        <div className="mt-10">
          {activeTab === 'venues' ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredVenues.map((venue) => (
                <Link
                  key={venue.id}
                  href={`/venue/${venue.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-white/12 bg-[#090909] transition-all duration-300 hover:border-white/30 hover:scale-[1.015] shadow-xl"
                >
                  {/* Poster Image */}
                  <div className="relative aspect-[16/11] w-full overflow-hidden bg-black">
                    <Image
                      src={venue.coverImage}
                      alt={venue.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                    {/* Top Right Orange Badge */}
                    <span className="absolute right-4 top-4 rounded-full border border-[#FF5A2B]/40 bg-[#FF4400] px-3.5 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-white shadow-lg">
                      TABLES AVAILABLE
                    </span>
                  </div>

                  {/* Card Info Details */}
                  <div className="flex flex-1 flex-col justify-between p-6 sm:p-7">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-[#FF6842]">
                        {venue.address}
                      </p>
                      <h3 className="mt-2 text-2xl sm:text-3xl font-black uppercase tracking-tight text-white group-hover:text-white/90">
                        {venue.name}
                      </h3>
                      <p className="mt-3 text-xs leading-relaxed text-white/55 line-clamp-2">
                        {venue.summary}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                      <div className="flex flex-wrap gap-1.5">
                        {venue.knownFor.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white/70"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-[#FF6842] group-hover:translate-x-1 transition-transform">
                        Explore →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredHosts.map((host) => (
                <Link
                  key={host.id}
                  href={`/host/${host.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-white/12 bg-[#090909] transition-all duration-300 hover:border-[#FF6842]/40 hover:scale-[1.015] shadow-xl"
                >
                  {/* Poster Image */}
                  <div className="relative aspect-[16/11] w-full overflow-hidden bg-black">
                    <Image
                      src={host.coverImage}
                      alt={host.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                    {/* Top Left Role Badge */}
                    <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/60 px-3.5 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-white">
                      {host.role}
                    </span>

                    {/* Verified Badge */}
                    {host.verified && (
                      <span className="absolute right-4 top-4 flex size-7 items-center justify-center rounded-full bg-[#FF4400] text-xs font-black text-white shadow-md">
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Card Info Details */}
                  <div className="flex flex-1 flex-col justify-between p-6 sm:p-7">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-white/45">
                        {host.neighborhood}, {host.city}
                      </p>
                      <h3 className="mt-2 text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                        {host.name}
                      </h3>
                      <p className="mt-3 text-xs leading-relaxed text-white/55 line-clamp-2">
                        {host.tagline}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                      <div className="flex flex-wrap gap-1.5">
                        {host.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white/70"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-[#FF6842] group-hover:translate-x-1 transition-transform">
                        View profile →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
