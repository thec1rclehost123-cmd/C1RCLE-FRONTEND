'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import {
  scanResponseSchema,
  startShiftResponseSchema,
  ticketAddonRedemptionResponseSchema,
  ticketLookupResponseSchema,
} from '@c1rcle/contracts';

import { bffClient } from '@/lib/bff/bff-client';
import { csrfHeaders } from '@/lib/onboarding/csrf';

import type { ScanResponse, StartShiftResponse, TicketLookupResponse } from '@c1rcle/contracts';
import type { ZodType } from 'zod';

interface BarcodeDetectorLike {
  detect(video: HTMLVideoElement): Promise<readonly { rawValue: string }[]>;
}
type BarcodeDetectorConstructor = new (options: {
  formats: readonly ['qr_code'];
}) => BarcodeDetectorLike;

export function ConnectedScannerScreen({
  studio,
  eventId,
  organizationId,
  eventTitle,
}: {
  readonly studio: 'host' | 'venue';
  readonly eventId: string;
  readonly organizationId: string;
  readonly eventTitle: string;
}) {
  const [code, setCode] = useState('');
  const [deviceId] = useState(() => crypto.randomUUID());
  const [shift, setShift] = useState<StartShiftResponse | null>(null);
  const [payload, setPayload] = useState('');
  const [preview, setPreview] = useState<TicketLookupResponse | null>(null);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [eligibilityVerified, setEligibilityVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stopCameraRef = useRef<((updateState?: boolean) => void) | null>(null);
  const startIntentKey = useRef<string | null>(null);
  const scanIntentKey = useRef<string | null>(null);
  const confirmIntentKey = useRef<string | null>(null);
  const addonIntentKeys = useRef(new Map<string, string>());

  useEffect(
    () => () => {
      stopCameraRef.current?.(false);
    },
    [],
  );

  async function startCamera() {
    setError(null);
    const Constructor = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor })
      .BarcodeDetector;
    if (!Constructor) {
      setError('Camera QR scanning is not supported in this browser. Enter the QR value manually.');
      return;
    }
    let stream: MediaStream | undefined;
    try {
      const activeStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } },
      });
      stream = activeStream;
      const video = videoRef.current;
      if (!video) {
        activeStream.getTracks().forEach((track) => {
          track.stop();
        });
        return;
      }
      video.srcObject = activeStream;
      await video.play();
      const detector = new Constructor({ formats: ['qr_code'] });
      let cancelled = false;
      const isCancelled = () => cancelled;
      let frame = 0;
      const stop = (updateState = true) => {
        cancelled = true;
        cancelAnimationFrame(frame);
        activeStream.getTracks().forEach((track) => {
          track.stop();
        });
        if (video.srcObject === activeStream) video.srcObject = null;
        if (updateState) setCameraActive(false);
      };
      stopCameraRef.current = stop;
      setCameraActive(true);
      const detect = async () => {
        if (cancelled) return;
        try {
          const codes = await detector.detect(video);
          if (isCancelled()) return;
          const value = codes.find((item) => item.rawValue.length > 0)?.rawValue;
          if (value) {
            setPayload(value);
            stop();
            stopCameraRef.current = null;
            return;
          }
        } catch {
          setError('Camera scanning stopped. Enter the QR value manually.');
          stop();
          stopCameraRef.current = null;
          return;
        }
        if (!isCancelled()) {
          frame = requestAnimationFrame(() => {
            void detect();
          });
        }
      };
      frame = requestAnimationFrame(() => {
        void detect();
      });
    } catch {
      stream?.getTracks().forEach((track) => {
        track.stop();
      });
      setError('Camera access is unavailable. Allow camera access or enter the QR value manually.');
    }
  }

  async function post<T>(body: Record<string, unknown>, schema: ZodType<T>): Promise<T> {
    return bffClient.post({
      path: '/api/bff/door',
      body,
      headers: csrfHeaders(),
      schema,
      retries: 0,
    });
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The scanner request failed.');
    } finally {
      setBusy(false);
    }
  }

  function resetTicket() {
    setPayload('');
    setPreview(null);
    setResult(null);
    setEligibilityVerified(false);
    setError(null);
    scanIntentKey.current = null;
    confirmIntentKey.current = null;
    addonIntentKeys.current.clear();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 text-stone-100 sm:px-6">
      <Link
        href={`/partner/${studio}/events/${encodeURIComponent(eventId)}`}
        className="text-sm text-stone-400"
      >
        ← {eventTitle}
      </Link>
      <section className="mt-5 rounded-2xl border border-white/15 bg-neutral-950 p-5 sm:p-7">
        <h1 className="text-2xl font-bold">Door scanner</h1>
        <p className="mt-2 text-sm text-stone-400">
          {eventTitle}. Scanner actions are checked by the event service.
        </p>

        {!shift ? (
          <form
            className="mt-6 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                startIntentKey.current ??= crypto.randomUUID();
                const started = await post(
                  {
                    operation: 'start',
                    organizationId,
                    idempotencyKey: startIntentKey.current,
                    eventId,
                    code: code.trim(),
                    deviceId,
                    deviceName: `Door device ${deviceId.slice(0, 6)}`,
                    sessionType: 'staff',
                  },
                  startShiftResponseSchema,
                );
                if (!started.permissions.canScan)
                  throw new Error('This door code cannot scan tickets.');
                startIntentKey.current = null;
                setShift(started);
              });
            }}
          >
            <label className="grid gap-2 text-sm">
              Event door code
              <input
                className="rounded-lg border border-white/20 bg-black px-3 py-3"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.trimStart());
                }}
                autoComplete="one-time-code"
                required
              />
            </label>
            <button
              className="rounded-lg bg-orange-500 px-4 py-3 font-semibold text-black disabled:opacity-50"
              disabled={busy}
            >
              {busy ? 'Starting shift…' : 'Start scanner shift'}
            </button>
          </form>
        ) : (
          <div className="mt-6">
            <p
              role="status"
              className="rounded-lg border border-emerald-400/30 bg-emerald-950/30 p-3 text-sm"
            >
              Scanner shift active · {shift.event.title} · {shift.gate ?? 'All gates'}
            </p>
            {!result ? (
              <form
                className="mt-5 grid gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void run(async () => {
                    const checked = await post(
                      {
                        operation: 'lookup',
                        organizationId,
                        sessionToken: shift.sessionToken,
                        eventId,
                        qrPayload: payload.trim(),
                      },
                      ticketLookupResponseSchema,
                    );
                    setPreview(checked);
                    setEligibilityVerified(false);
                    scanIntentKey.current = null;
                    confirmIntentKey.current = null;
                    addonIntentKeys.current.clear();
                  });
                }}
              >
                <video
                  ref={videoRef}
                  className={
                    cameraActive ? 'max-h-72 w-full rounded-lg bg-black object-contain' : 'hidden'
                  }
                  aria-label="Ticket QR camera view"
                  muted
                  playsInline
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="rounded-lg border border-white/20 px-4 py-3 font-semibold"
                    disabled={busy || cameraActive}
                    onClick={() => {
                      void startCamera();
                    }}
                  >
                    Scan with camera
                  </button>
                  {cameraActive ? (
                    <button
                      type="button"
                      className="rounded-lg border border-white/20 px-4 py-3"
                      onClick={() => {
                        stopCameraRef.current?.();
                        stopCameraRef.current = null;
                      }}
                    >
                      Stop camera
                    </button>
                  ) : null}
                </div>
                <label className="grid gap-2 text-sm">
                  Ticket QR payload
                  <textarea
                    className="min-h-24 rounded-lg border border-white/20 bg-black px-3 py-3 font-mono text-sm"
                    value={payload}
                    onChange={(event) => {
                      setPayload(event.target.value);
                    }}
                    autoComplete="off"
                    required
                  />
                </label>
                <p className="text-xs text-stone-400">
                  Camera scanning uses browser QR detection when available. Enter the QR value
                  manually if it is unsupported.
                </p>
                <button
                  className="rounded-lg border border-white/20 px-4 py-3 font-semibold disabled:opacity-50"
                  disabled={busy}
                >
                  {busy ? 'Checking…' : 'Check ticket'}
                </button>
              </form>
            ) : null}

            {preview ? (
              <div className="mt-5 rounded-xl border border-white/15 p-4">
                <h2 className="font-semibold">
                  {preview.status === 'valid' ? 'Ticket found' : 'Ticket cannot be admitted'}
                </h2>
                {preview.entitlement ? (
                  <p className="mt-2 text-sm text-stone-300">
                    {preview.entitlement.tierName} · {preview.entitlement.holderName}
                  </p>
                ) : null}
                {preview.entitlement?.ticketAddons?.length ? (
                  <section className="mt-4 rounded-lg border border-white/10 p-3">
                    <h3 className="font-semibold">Ticket extras</h3>
                    <ul className="mt-2 grid gap-3">
                      {preview.entitlement.ticketAddons.map((addon) => (
                        <li
                          key={addon.id}
                          className="flex flex-wrap items-center justify-between gap-3 text-sm"
                        >
                          <span>
                            {addon.name} · {addon.status}
                          </span>
                          {addon.status === 'active' ? (
                            <button
                              type="button"
                              className="rounded-lg border border-white/20 px-3 py-2 font-semibold disabled:opacity-50"
                              disabled={busy}
                              onClick={() => {
                                void run(async () => {
                                  const idempotencyKey =
                                    addonIntentKeys.current.get(addon.id) ?? crypto.randomUUID();
                                  addonIntentKeys.current.set(addon.id, idempotencyKey);
                                  const redeemed = await post(
                                    {
                                      operation: 'redeemAddon',
                                      organizationId,
                                      idempotencyKey,
                                      sessionToken: shift.sessionToken,
                                      eventId,
                                      entitlementId: preview.entitlement?.id,
                                      addonEntitlementId: addon.id,
                                    },
                                    ticketAddonRedemptionResponseSchema,
                                  );
                                  addonIntentKeys.current.delete(addon.id);
                                  setPreview((current) =>
                                    current?.entitlement
                                      ? {
                                          ...current,
                                          entitlement: {
                                            ...current.entitlement,
                                            ticketAddons: current.entitlement.ticketAddons?.map(
                                              (item) =>
                                                item.id === redeemed.addon.id
                                                  ? redeemed.addon
                                                  : item,
                                            ),
                                          },
                                        }
                                      : current,
                                  );
                                });
                              }}
                            >
                              Redeem extra
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
                {preview.denyMessage ? (
                  <p className="mt-2 text-sm text-rose-300">{preview.denyMessage}</p>
                ) : null}
                {preview.status === 'valid' && preview.entitlement?.eligibilityPolicy ? (
                  <div className="mt-4 rounded-lg border border-amber-300/30 bg-amber-950/20 p-3 text-sm">
                    <p>
                      Eligibility check: {preview.entitlement.eligibilityPolicy.audienceType}
                      {preview.entitlement.eligibilityPolicy.minAge !== null
                        ? ` · minimum age ${String(preview.entitlement.eligibilityPolicy.minAge)}`
                        : ''}
                      {preview.entitlement.eligibilityPolicy.maxAge !== null
                        ? ` · maximum age ${String(preview.entitlement.eligibilityPolicy.maxAge)}`
                        : ''}
                    </p>
                    <label className="mt-3 flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={eligibilityVerified}
                        onChange={(event) => {
                          setEligibilityVerified(event.target.checked);
                        }}
                        className="mt-1"
                      />
                      <span>I checked that each ticket holder meets this entry policy.</span>
                    </label>
                  </div>
                ) : null}
                {preview.status === 'valid' ? (
                  <button
                    type="button"
                    className="mt-4 rounded-lg bg-orange-500 px-4 py-3 font-semibold text-black disabled:opacity-50"
                    disabled={
                      busy ||
                      (Boolean(preview.entitlement?.eligibilityPolicy) && !eligibilityVerified)
                    }
                    onClick={() => {
                      void run(async () => {
                        scanIntentKey.current ??= crypto.randomUUID();
                        const scanned = await post(
                          {
                            operation: 'scan',
                            organizationId,
                            idempotencyKey: scanIntentKey.current,
                            sessionToken: shift.sessionToken,
                            eventId,
                            qrPayload: payload.trim(),
                            ...(eligibilityVerified ? { eligibilityVerified: true } : {}),
                          },
                          scanResponseSchema,
                        );
                        scanIntentKey.current = null;
                        setResult(scanned);
                      });
                    }}
                  >
                    {busy ? 'Admitting…' : 'Admit ticket'}
                  </button>
                ) : null}
              </div>
            ) : null}

            {result ? (
              <div className="mt-5 rounded-xl border border-white/15 p-4" role="status">
                <h2 className="font-semibold">
                  {result.status === 'consumed'
                    ? 'Admission recorded'
                    : result.status === 'confirmation_required'
                      ? 'Confirm both ticket holders'
                      : 'Admission denied'}
                </h2>
                {result.denyMessage ? (
                  <p className="mt-2 text-sm text-rose-300">{result.denyMessage}</p>
                ) : null}
                {result.status === 'confirmation_required' && result.confirmation ? (
                  <button
                    type="button"
                    className="mt-4 rounded-lg bg-orange-500 px-4 py-3 font-semibold text-black disabled:opacity-50"
                    disabled={busy}
                    onClick={() => {
                      void run(async () => {
                        confirmIntentKey.current ??= crypto.randomUUID();
                        const confirmed = await post(
                          {
                            operation: 'confirm',
                            organizationId,
                            idempotencyKey: confirmIntentKey.current,
                            sessionToken: shift.sessionToken,
                            eventId,
                            confirmationToken: result.confirmation?.token,
                            confirmed: true,
                          },
                          scanResponseSchema,
                        );
                        confirmIntentKey.current = null;
                        setResult(confirmed);
                      });
                    }}
                  >
                    Both holders are present
                  </button>
                ) : null}
                <button
                  type="button"
                  className="ml-3 mt-4 rounded-lg border border-white/20 px-4 py-3"
                  onClick={resetTicket}
                >
                  Scan next ticket
                </button>
              </div>
            ) : null}
          </div>
        )}
        {error ? (
          <p role="alert" className="mt-4 text-sm text-rose-300">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}
