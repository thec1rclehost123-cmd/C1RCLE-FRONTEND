import { describe, expect, it, vi } from 'vitest';

import HostDirectoryAliasPage from './page';

const permanentRedirect = vi.hoisted(() => vi.fn(() => undefined));

vi.mock('next/navigation', () => ({ permanentRedirect }));

describe('HostDirectoryAliasPage', () => {
  it('permanently redirects the singular directory alias', () => {
    HostDirectoryAliasPage();
    expect(permanentRedirect).toHaveBeenCalledWith('/hosts');
  });
});
