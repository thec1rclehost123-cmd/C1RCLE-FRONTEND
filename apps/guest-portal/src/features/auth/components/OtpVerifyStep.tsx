'use client';

import React from 'react';

export interface OtpVerifyStepProps {
  phone: string;
  otp: string;
  onOtpChange: (otp: string) => void;
  onResend: () => void;
  onEditPhone: () => void;
  error?: string;
  disabled?: boolean;
}

export const OtpVerifyStep: React.FC<OtpVerifyStepProps> = ({
  phone,
  otp,
  onOtpChange,
  onResend,
  onEditPhone,
  error,
  disabled = false,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <label htmlFor="otp-input" className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 block">
          ENTER VERIFICATION CODE
        </label>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
          Code sent to <span className="text-white">{phone || '+91 9876543210'}</span>
          <button
            type="button"
            onClick={onEditPhone}
            className="ml-2 text-[#FF4400] underline uppercase text-[9px] hover:text-[#FF4400]/80"
          >
            Edit
          </button>
        </p>
      </div>

      <input
        id="otp-input"
        type="text"
        maxLength={6}
        disabled={disabled}
        value={otp}
        onChange={(e) => {
          onOtpChange(e.target.value.replace(/\D/g, ''));
        }}
        placeholder="123456"
        className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 text-center text-xl font-mono font-black tracking-[0.5em] text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF4400]/50"
      />

      {error && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF4400] text-center">
          {error}
        </p>
      )}

      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
        <span className="text-white/40">Didn&apos;t receive code?</span>
        <button
          type="button"
          onClick={onResend}
          disabled={disabled}
          className="text-[#FF4400] hover:underline hover:text-[#FF4400]/80 disabled:opacity-50"
        >
          Resend OTP
        </button>
      </div>
    </div>
  );
};
