'use client';

import React from 'react';

import type { CountryOption } from '../types/login.types';

export interface PhoneStepProps {
  countries: CountryOption[];
  selectedCountry: string;
  phone: string;
  onCountryChange: (countryCode: string) => void;
  onPhoneChange: (phone: string) => void;
  error?: string;
  disabled?: boolean;
}

export const PhoneStep: React.FC<PhoneStepProps> = ({
  countries,
  selectedCountry,
  phone,
  onCountryChange,
  onPhoneChange,
  error,
  disabled = false,
}) => {
  const currentCountry = countries.find((c) => c.code === selectedCountry) ?? countries[0];

  return (
    <div className="space-y-4">
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 block">
        PHONE NUMBER
      </span>

      {/* Country Selector */}
      <div className="space-y-1.5">
        <label htmlFor="country-select" className="text-[9px] font-bold uppercase tracking-widest text-white/40 block">
          Country
        </label>
        <select
          id="country-select"
          value={selectedCountry}
          onChange={(e) => {
            onCountryChange(e.target.value);
          }}
          disabled={disabled}
          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-xs font-bold tracking-widest text-white focus:outline-none focus:border-[#FF4400]/50"
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code} className="bg-black text-white">
              {c.flag} {c.name} ({c.dialCode})
            </option>
          ))}
        </select>
      </div>

      {/* Phone Input */}
      <div className="space-y-1.5">
        <label htmlFor="phone-input" className="text-[9px] font-bold uppercase tracking-widest text-white/40 block">
          Mobile Number
        </label>
        <div className="flex items-center gap-2">
          <span className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-xs font-bold tracking-widest text-white/80">
            {currentCountry?.dialCode}
          </span>
          <input
            id="phone-input"
            type="tel"
            required
            disabled={disabled}
            value={phone}
            onChange={(e) => {
              onPhoneChange(e.target.value);
            }}
            placeholder="9876543210"
            className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-xs font-bold tracking-widest text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF4400]/50"
          />
        </div>
      </div>

      {error && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF4400]">
          {error}
        </p>
      )}
    </div>
  );
};
