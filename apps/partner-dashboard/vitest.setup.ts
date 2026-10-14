import '@testing-library/jest-dom/vitest';

import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

configure({ asyncUtilTimeout: 10_000 });

// Node >= 25 ships an experimental global `localStorage` that, without
// `--localstorage-file`, is an empty stub which shadows jsdom's Storage. The
// repo pins Node 22 (where this is a no-op), but contributors on newer Node
// would see `localStorage.getItem` undefined in any component that reads it.
const existingStorage = (window as { localStorage?: Partial<Storage> }).localStorage;
if (typeof existingStorage?.getItem !== 'function') {
  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => {
      store.clear();
    },
    getItem: (key) => store.get(key) ?? null,
    key: (index) => [...store.keys()][index] ?? null,
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, value);
    },
  };
  Object.defineProperty(window, 'localStorage', { value: memoryStorage, configurable: true });
  Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage, configurable: true });
}

afterEach(() => {
  cleanup();
});
