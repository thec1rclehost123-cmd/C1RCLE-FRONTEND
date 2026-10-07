import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  noContentSchema,
  pageInfoSchema,
  paginatedSchema,
  roleSchema,
  sessionSchema,
  userSchema,
} from './schemas.js';

/*
 * `schemas.ts` is the client-facing façade over the backend-owned contract
 * envelopes. These tests pin the behaviour the rest of the client relies on:
 * they are response schemas (parse, don't transform), so "accept a valid
 * payload / reject a malformed one" is the whole contract.
 */
describe('schemas (envelope contracts re-exported from @c1rcle/contracts)', () => {
  describe('pageInfoSchema', () => {
    it('accepts a complete page description', () => {
      const result = pageInfoSchema.safeParse({
        page: 0,
        pageSize: 25,
        total: 87,
        hasNextPage: true,
      });
      expect(result.success).toBe(true);
    });

    it('rejects a partial page description', () => {
      expect(pageInfoSchema.safeParse({ page: 2, hasNextPage: true }).success).toBe(false);
    });
  });

  describe('paginatedSchema', () => {
    it('wraps a typed item list with pageInfo', () => {
      const schema = paginatedSchema(z.string());
      const result = schema.safeParse({
        items: ['a', 'b'],
        pageInfo: { page: 1, pageSize: 2, total: 2, hasNextPage: false },
      });
      expect(result.success).toBe(true);
    });

    it('rejects items that do not match the item schema', () => {
      const schema = paginatedSchema(z.number());
      expect(
        schema.safeParse({
          items: ['not-a-number'],
          pageInfo: { page: 1, pageSize: 2, total: 2, hasNextPage: false },
        }).success,
      ).toBe(false);
    });
  });

  describe('roleSchema', () => {
    it('accepts every known role', () => {
      for (const role of ['guest', 'partner', 'admin'] as const) {
        expect(roleSchema.safeParse(role).success).toBe(true);
      }
    });

    it('rejects an unknown role', () => {
      expect(roleSchema.safeParse('superuser').success).toBe(false);
    });
  });

  describe('userSchema', () => {
    it('accepts a valid user with a null avatar', () => {
      const user = {
        id: 'u_1',
        email: 'owner@c1rcle.test',
        displayName: 'Owner',
        role: 'partner',
        avatarUrl: null,
      };
      expect(userSchema.safeParse(user).success).toBe(true);
    });

    it('rejects an invalid email or role', () => {
      expect(
        userSchema.safeParse({
          id: 'u_1',
          email: 'not-an-email',
          displayName: 'Owner',
          role: 'admin',
          avatarUrl: null,
        }).success,
      ).toBe(false);
    });
  });

  describe('sessionSchema', () => {
    const session = {
      user: {
        id: 'u_1',
        email: 'owner@c1rcle.test',
        displayName: 'Owner',
        role: 'guest',
        avatarUrl: null,
      },
      expiresAt: 1_800_000_000,
    };

    it('accepts a session wrapping a valid user', () => {
      expect(sessionSchema.safeParse(session).success).toBe(true);
    });

    it('rejects a non-positive expiry timestamp', () => {
      expect(sessionSchema.safeParse({ ...session, expiresAt: 0 }).success).toBe(false);
    });
  });

  describe('noContentSchema', () => {
    it('accepts undefined (204 No Content semantics)', () => {
      expect(noContentSchema.safeParse(undefined).success).toBe(true);
    });
  });
});
