import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useMounted } from './use-mounted.js';

describe('useMounted', () => {
  it('is true on the client after mounting', () => {
    const { result } = renderHook(() => useMounted());
    expect(result.current).toBe(true);
  });

  it('stays true across re-renders', () => {
    const { result, rerender } = renderHook(() => useMounted());

    rerender();
    rerender();

    expect(result.current).toBe(true);
  });
});
