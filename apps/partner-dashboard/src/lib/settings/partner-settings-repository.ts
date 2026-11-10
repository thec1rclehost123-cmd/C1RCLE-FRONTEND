import { z } from 'zod';

import { partnerSettingsDtoSchema, updatePartnerSettingsSchema } from '@c1rcle/contracts/client';

import { apiClient } from '@/lib/api/client';
import { uploadToSignedUrl } from '@/lib/onboarding/uploadToSignedUrl';

import type { PartnerSettingsDto, UpdatePartnerSettingsInput } from '@c1rcle/contracts/client';

const uploadGrantSchema = z.object({
  uploadUrl: z.url(),
  method: z.literal('PUT'),
  headers: z.record(z.string(), z.string()),
  publicUrl: z.url(),
  expiresAt: z.number().int(),
});

const orgHeaders = (organizationId: string) => ({ 'X-Organization-Id': organizationId });

export function getPartnerSettings(organizationId: string): Promise<PartnerSettingsDto> {
  return apiClient.get({
    path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/partner-settings`,
    headers: orgHeaders(organizationId),
    schema: partnerSettingsDtoSchema,
  });
}

export function updatePartnerSettings(
  organizationId: string,
  update: UpdatePartnerSettingsInput,
): Promise<PartnerSettingsDto> {
  return apiClient.patch({
    path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/partner-settings`,
    headers: {
      ...orgHeaders(organizationId),
      'Idempotency-Key': crypto.randomUUID(),
    },
    body: updatePartnerSettingsSchema.parse(update),
    schema: partnerSettingsDtoSchema,
  });
}

export async function uploadPartnerProfileImage(
  organizationId: string,
  file: File,
): Promise<string> {
  const response = await apiClient.post({
    path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/partner-profile-media/upload-url`,
    headers: {
      ...orgHeaders(organizationId),
      'Idempotency-Key': crypto.randomUUID(),
    },
    body: { contentType: file.type, fileName: file.name },
    schema: uploadGrantSchema,
  });
  await uploadToSignedUrl(response.uploadUrl, response.headers, file);
  return response.publicUrl;
}
