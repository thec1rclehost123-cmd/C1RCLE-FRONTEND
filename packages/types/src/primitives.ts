/** Flattens an intersection so editors show one readable object shape. */
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

/**
 * A nominal type. `Brand<string, 'UserId'>` is a string that a plain string
 * cannot be assigned to, which stops IDs of different kinds being swapped.
 */
export type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand };

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type ValueOf<T> = T[keyof T];
