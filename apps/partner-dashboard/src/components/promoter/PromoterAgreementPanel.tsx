'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  getMine,
  getPromoterAgreement,
  acceptPromoterAgreement,
} from '@/lib/onboarding/onboarding-repository';

import type { OnboardingRequestDto } from '@c1rcle/contracts/client';

export function PromoterAgreementPanel() {
  const router = useRouter();
  const [data, setData] = useState<{
    application: OnboardingRequestDto | null;
    status: Awaited<ReturnType<typeof getPromoterAgreement>>;
  } | null>(null);
  const [checked, setChecked] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    void Promise.all([getMine('promoter'), getPromoterAgreement()])
      .then(([application, status]) => {
        if (active) {
          setData({ application, status });
          setChecked(false);
        }
      })
      .catch(() => {
        if (active) setError('The agreement could not be loaded. Please retry.');
      });
    return () => {
      active = false;
    };
  }, [reload]);
  const artifact = data?.status.agreement;
  const application = data?.application;
  const accepted =
    artifact != null &&
    Boolean(
      application?.promoterAgreementAcceptances.some(
        (a) =>
          a.version === artifact.version &&
          a.textSha256 === artifact.textSha256 &&
          a.artifactStatus === artifact.status &&
          a.acceptedBy === application.userId,
      ),
    );
  async function accept() {
    if (!artifact || !application || !checked || pending || !data.status.activationAvailable)
      return;
    setPending(true);
    setError(null);
    try {
      const updated = await acceptPromoterAgreement(
        application.id,
        artifact.version,
        crypto.randomUUID(),
      );
      setData({ ...data, application: updated });
      setChecked(false);
      router.refresh();
    } catch {
      setError(
        'Acceptance could not be confirmed. Reload the current agreement before trying again.',
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <section
      className="mx-auto max-w-3xl px-5 py-8 text-white"
      aria-labelledby="promoter-agreement-heading"
    >
      <h1 id="promoter-agreement-heading" className="text-2xl font-semibold">
        Promoter agreement
      </h1>
      {error && (
        <div role="alert" className="mt-4">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => {
              setReload((n) => n + 1);
            }}
            disabled={pending}
          >
            Reload agreement
          </button>
        </div>
      )}
      {!data && !error && (
        <p role="status" className="mt-4">
          Loading agreement…
        </p>
      )}
      {data && !artifact && (
        <p className="mt-4">
          No approved Promoter agreement is available. Campaign activation remains unavailable.
        </p>
      )}
      {artifact && (
        <>
          {artifact.status === 'staging_only' && (
            <p className="mt-4 font-semibold text-orange-400">
              STAGING ONLY — FOR TESTING. This is not the production legal agreement.
            </p>
          )}
          <p className="mt-3 break-all text-sm text-white/60">Version {artifact.version}</p>
          <div className="mt-6 whitespace-pre-wrap break-words text-sm leading-7">
            {artifact.text}
          </div>
          {accepted ? (
            <p role="status" className="mt-6">
              You accepted this version.
            </p>
          ) : application?.requestedType === 'promoter' && data.status.activationAvailable ? (
            <div className="mt-6">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={pending}
                  onChange={(e) => {
                    setChecked(e.target.checked);
                  }}
                />
                <span>
                  {artifact.status === 'staging_only'
                    ? 'I have read and accept this staging-only agreement for testing.'
                    : 'I have read and accept this Promoter agreement.'}
                </span>
              </label>
              <button
                type="button"
                className="mt-5 bg-orange-500 px-5 py-3 font-semibold text-black disabled:opacity-40"
                disabled={!checked || pending}
                onClick={() => void accept()}
              >
                {pending ? 'Confirming acceptance…' : 'Accept agreement'}
              </button>
            </div>
          ) : (
            <p className="mt-6">
              A Promoter application is required to accept the current agreement.
            </p>
          )}
        </>
      )}
    </section>
  );
}
