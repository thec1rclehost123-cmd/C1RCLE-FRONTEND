export declare function isApiClientError(_error: unknown): boolean;
export declare class ApiClientError extends Error {
    isRetryable: boolean;
}
