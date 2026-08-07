// Pure UI mode - API client stub
export function isApiClientError(_error: unknown) {
  return false;
}

export class ApiClientError extends Error {
  isRetryable = false;
}
