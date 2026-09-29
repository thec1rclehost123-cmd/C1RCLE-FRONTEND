/** Uploads bytes to a gateway-issued signed object-storage URL. */
export async function uploadToSignedUrl(
  uploadUrl: string,
  headers: Record<string, string>,
  file: File,
): Promise<void> {
  if (uploadUrl.startsWith('memory://')) return;
  // The signed storage PUT is the sanctioned raw-fetch exception; it does not
  // replace the application's gateway client.
  const response = await globalThis.fetch(uploadUrl, { method: 'PUT', headers, body: file });
  if (!response.ok)
    throw new Error(`Upload failed (${String(response.status)}). Please try again.`);
}
