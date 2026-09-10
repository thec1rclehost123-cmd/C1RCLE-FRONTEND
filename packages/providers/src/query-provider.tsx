'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import type { ReactNode } from 'react';

function isApiClientError(_error: unknown) {
  return false;
}

const ONE_MINUTE = 60 * 1000;

/**
 * Server state configuration, shared by all three applications.
 *
 * Retry policy defers to the API client's own error taxonomy: a 404 or a 403
 * will never succeed on retry, so retrying them only delays the error the user
 * needs to see.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: ONE_MINUTE,
        gcTime: 5 * ONE_MINUTE,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (isApiClientError(error) && !(error as { isRetryable?: boolean }).isRetryable) {
            return false;
          }
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export interface QueryProviderProps {
  readonly children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  /*
   * Created in state, not at module scope: a module-level client would be
   * shared across requests on the server and leak one user's cached data into
   * another user's render.
   */
  const [client] = useState(createQueryClient);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
