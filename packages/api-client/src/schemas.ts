import { z } from 'zod';

/**
 * Runtime contracts for responses shared across applications.
 *
 * Endpoint-specific schemas live next to the feature that calls them. These
 * are only the envelopes every endpoint shares.
 */

export const pageInfoSchema = z.object({
  page: z.number().int().nonnegative(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
});

export function paginatedSchema<TItem extends z.ZodType>(
  item: TItem,
): z.ZodObject<{ items: z.ZodArray<TItem>; pageInfo: typeof pageInfoSchema }> {
  return z.object({
    items: z.array(item),
    pageInfo: pageInfoSchema,
  });
}

export const roleSchema = z.enum(['guest', 'partner', 'admin']);

export const userSchema = z.object({
  id: z.string().min(1),
  email: z.email(),
  displayName: z.string().min(1),
  role: roleSchema,
  avatarUrl: z.url().nullable(),
});

export const sessionSchema = z.object({
  user: userSchema,
  expiresAt: z.number().int().positive(),
});

/** For endpoints that return 204 No Content. */
export const noContentSchema = z.undefined();
