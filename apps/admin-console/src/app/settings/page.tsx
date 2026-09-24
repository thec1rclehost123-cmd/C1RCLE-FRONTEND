'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useSession } from '@c1rcle/auth';
import { Button, ErrorState, LoadingState, TextField } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { getPlatformSettings, listAdmins, updatePlatformSettings } from '@/lib/admin/admin-api';
import { formatDateTime, StatusBadge } from '@/lib/admin/format';

/**
 * ─── Admin settings ───────────────────────────────────────────────────────────
 * The admin's own profile (read-only — password/account changes go through
 * Better Auth's UI, v1's settings screen was mostly dead code) and, new in
 * Phase 7, the platform-wide settings singleton: the refund approval
 * thresholds the amount-tier logic reads at request time, the platform fee
 * rate, and maintenance mode. Threshold updates take effect on the next
 * refund request — no restart, no migration.
 */
export default function SettingsDesk() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const admins = useQuery({
    queryKey: ['admin', 'admins', 'self'],
    queryFn: () => listAdmins(100),
    enabled: user !== null,
  });

  const self = admins.data?.items.find((admin) => admin.id === user?.id) ?? null;

  const platformSettings = useQuery({
    queryKey: ['admin', 'settings', 'platform'],
    queryFn: () => getPlatformSettings(),
    enabled: user !== null,
  });

  const [feeRateDraft, setFeeRateDraft] = useState('');
  const [singleDraft, setSingleDraft] = useState('');
  const [dualDraft, setDualDraft] = useState('');

  const settings = platformSettings.data;

  const saveMutation = useMutation({
    mutationFn: () =>
      updatePlatformSettings({
        platformFeeRate: feeRateDraft === '' ? undefined : Number(feeRateDraft),
        refundSingleApproverThresholdPaise: singleDraft === '' ? undefined : Number(singleDraft),
        refundDualApproverThresholdPaise: dualDraft === '' ? undefined : Number(dualDraft),
        maintenanceMode: settings?.maintenanceMode,
      }),
    onSuccess: (updated) => {
      void queryClient.setQueryData(['admin', 'settings', 'platform'], updated);
      setFeeRateDraft('');
      setSingleDraft('');
      setDualDraft('');
    },
  });

  const maintenanceMutation = useMutation({
    mutationFn: (maintenanceMode: boolean) => updatePlatformSettings({ maintenanceMode }),
    onSuccess: (updated) => {
      void queryClient.setQueryData(['admin', 'settings', 'platform'], updated);
    },
  });

  const dirty = feeRateDraft !== '' || singleDraft !== '' || dualDraft !== '';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Your admin profile. Password and account changes go through the sign-in provider, not a form here — v1's settings screen was mostly dead code once that was accounted for. The platform cards below are live: refund thresholds are read at every refund request."
      />

      {user === null ? (
        <ErrorState description="No session." />
      ) : admins.isPending ? (
        <LoadingState label="Loading profile…" />
      ) : admins.isError ? (
        <ErrorState
          description="Your admin record could not be loaded. Please retry."
          onRetry={() => void admins.refetch()}
        />
      ) : (
        <div className="max-w-lg rounded-lg border border-border p-6">
          <dl className="flex flex-col gap-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Email</dt>
              <dd className="mt-1">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Platform role
              </dt>
              <dd className="mt-1">
                {self === null ? (
                  <span className="text-muted-foreground">
                    Not a platform admin record — session role only ({user.role})
                  </span>
                ) : (
                  <StatusBadge label={self.role} tone={self.isActive ? 'success' : 'muted'} />
                )}
              </dd>
            </div>
            {self !== null ? (
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Admin since
                </dt>
                <dd className="mt-1 text-muted-foreground">{formatDateTime(self.createdAt)}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      )}

      {platformSettings.isPending ? (
        <LoadingState label="Loading platform settings…" />
      ) : platformSettings.isError ? (
        <div className="max-w-2xl">
          <ErrorState
            description="Platform settings could not be loaded. Please retry."
            onRetry={() => void platformSettings.refetch()}
          />
        </div>
      ) : (
        <div className="max-w-2xl rounded-lg border border-border p-6">
          <h2 className="text-sm font-semibold">Platform settings</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Applied live. Refund thresholds are compared in paise; the fee rate is a fraction (0–1).
            Updated {settings !== undefined ? formatDateTime(settings.updatedAt) : ''}.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TextField
              label="Platform fee rate"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={feeRateDraft}
              onChange={(event) => {
                setFeeRateDraft(event.target.value);
              }}
              placeholder={settings !== undefined ? String(settings.platformFeeRate) : ''}
            />
            <TextField
              label="Single approver threshold (paise)"
              type="number"
              min={0}
              step={100}
              value={singleDraft}
              onChange={(event) => {
                setSingleDraft(event.target.value);
              }}
              placeholder={
                settings !== undefined ? String(settings.refundSingleApproverThresholdPaise) : ''
              }
            />
            <TextField
              label="Dual approver threshold (paise)"
              type="number"
              min={0}
              step={100}
              value={dualDraft}
              onChange={(event) => {
                setDualDraft(event.target.value);
              }}
              placeholder={
                settings !== undefined ? String(settings.refundDualApproverThresholdPaise) : ''
              }
            />
            <div className="flex items-end gap-2">
              <Button
                variant="primary"
                disabled={!dirty || saveMutation.isPending}
                onClick={() => {
                  saveMutation.mutate();
                }}
              >
                {saveMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
              {dirty ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setFeeRateDraft('');
                    setSingleDraft('');
                    setDualDraft('');
                  }}
                >
                  Reset
                </Button>
              ) : null}
              {saveMutation.isError ? (
                <span className="text-xs text-destructive">Save failed.</span>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <div>
              <p className="text-sm font-medium">Maintenance mode</p>
              <p className="text-xs text-muted-foreground">
                {settings?.maintenanceMode
                  ? 'On — affected flows are gated.'
                  : 'Off — normal operation.'}
              </p>
            </div>
            <Button
              variant={settings?.maintenanceMode ? 'destructive' : 'outline'}
              size="sm"
              disabled={maintenanceMutation.isPending}
              onClick={() => {
                maintenanceMutation.mutate(!settings?.maintenanceMode);
              }}
            >
              {maintenanceMutation.isPending
                ? 'Updating…'
                : settings?.maintenanceMode
                  ? 'Disable'
                  : 'Enable'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
