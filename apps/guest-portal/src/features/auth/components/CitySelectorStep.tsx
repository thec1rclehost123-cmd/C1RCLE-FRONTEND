'use client';

import React from 'react';

export interface CitySelectorStepProps {
  cities: string[];
  selectedCity: string;
  onSelectCity: (city: string) => void;
  disabled?: boolean;
}

export const CitySelectorStep: React.FC<CitySelectorStepProps> = ({
  cities,
  selectedCity,
  onSelectCity,
  disabled = false,
}) => {
  return (
    <div className="space-y-4">
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 block">
        WHERE ARE YOU BASED?
      </span>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
        CHOOSE YOUR CITY TO COMPLETE SETUP.
      </p>
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
        {cities.map((city) => {
          const isSelected = selectedCity === city;
          return (
            <button
              type="button"
              key={city}
              disabled={disabled}
              onClick={() => {
                onSelectCity(city);
              }}
              className={`flex h-16 items-center justify-center rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all border disabled:opacity-50 ${
                isSelected
                  ? 'bg-[#FF4400] text-white border-[#FF4400] shadow-lg shadow-[#FF4400]/20'
                  : 'bg-white/[0.05] text-white/80 border-white/10 hover:border-[#FF4400]/40 hover:bg-white/[0.1] hover:text-white'
              }`}
            >
              {city}
            </button>
          );
        })}
      </div>
    </div>
  );
};
