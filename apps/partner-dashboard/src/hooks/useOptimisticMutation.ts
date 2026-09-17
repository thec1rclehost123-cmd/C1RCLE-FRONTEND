import { useCallback, useRef, useState } from 'react';

export interface OptimisticMutateOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onMutate?: (variables: TVariables) => Promise<() => void> | (() => void);
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables, rollback: () => void) => void;
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
}

export interface OptimisticMutateResult<TData, TVariables> {
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  data: TData | undefined;
  reset: () => void;
}

export function useOptimisticMutation<TData, TVariables>(
  options: OptimisticMutateOptions<TData, TVariables>
): OptimisticMutateResult<TData, TVariables> {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | undefined>(undefined);

  const rollbackRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);

  const reset = useCallback(() => {
    setIsPending(false);
    setIsSuccess(false);
    setIsError(false);
    setError(null);
    setData(undefined);
  }, []);

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      if (!mountedRef.current) throw new Error('Component unmounted');
      
      setIsPending(true);
      setIsError(false);
      setError(null);

      let rollback: (() => void) | undefined;

      try {
        if (options.onMutate) {
          rollback = await options.onMutate(variables);
          rollbackRef.current = rollback;
        }

        const result = await options.mutationFn(variables);

        if (!mountedRef.current) throw new Error('Component unmounted');

        setData(result);
        setIsSuccess(true);
        setIsPending(false);
        options.onSuccess?.(result, variables);
        options.onSettled?.(result, null, variables);

        return result;
      } catch (err) {
        if (!mountedRef.current) throw err;

        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsError(true);
        setIsPending(false);

        if (rollback) {
          rollback();
        } else if (rollbackRef.current) {
          rollbackRef.current();
        }

        options.onError?.(error, variables, rollback ?? (() => {}));
        options.onSettled?.(undefined, error, variables);

        throw error;
      }
    },
    [options]
  );

  const mutate = useCallback(
    (variables: TVariables) => {
      mutateAsync(variables).catch(() => {});
    },
    [mutateAsync]
  );

  return {
    mutate,
    mutateAsync,
    isPending,
    isSuccess,
    isError,
    error,
    data,
    reset,
  };
}