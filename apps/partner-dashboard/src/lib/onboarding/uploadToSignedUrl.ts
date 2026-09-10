/**
 * Puts a KYC image straight to Google Cloud Storage using the pre-signed URL minted by
 * `POST .../documents/upload-url`. This is a cross-origin PUT to a non-gateway host, so it
 * deliberately bypasses `@c1rcle/api-client` (which only talks to the gateway origin) and uses a
 * bare `fetch` instead — the one sanctioned exception to the repo-wide "no raw fetch" rule.
 */

/** The memory storage driver returns a `memory://` placeholder — there is nothing to PUT to. */
const MEMORY_DRIVER_PREFIX = 'memory://';

export async function uploadToSignedUrl(
  uploadUrl: string,
  headers: Record<string, string>,
  file: File,
): Promise<void> {
  if (uploadUrl.startsWith(MEMORY_DRIVER_PREFIX)) {
    return;
  }

  // eslint-disable-next-line no-restricted-globals, no-restricted-syntax -- opaque cross-origin PUT to Google Storage, not a gateway call; @c1rcle/api-client cannot do this
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers,
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Upload failed (${String(response.status)}). Please try again.`);
  }
}
