declare const brandSymbol: unique symbol;

/** Nominal brand wrapper preventing accidental mixing of distinct domain scalars. */
export type Brand<Base, Name extends string> = Base & {
  readonly [brandSymbol]: Name;
};

/** Array guaranteed at the type level to contain at least one element. */
export type NonEmptyArray<A> = readonly [A, ...A[]];

export function isNonEmpty<A>(items: readonly A[]): items is NonEmptyArray<A> {
  return items.length > 0;
}

export function head<A>(items: NonEmptyArray<A>): A {
  return items[0];
}

/** Discriminated sum-type node keyed by `_tag`. */
export interface Tagged<Tag extends string> {
  readonly _tag: Tag;
}

export type MatchHandlers<U extends Tagged<string>, R> = {
  readonly [K in U['_tag']]: (variant: Extract<U, Tagged<K>>) => R;
};

export function assertNever(value: never, context = 'Unexpected ADT variant'): never {
  throw new Error(`${context}: ${JSON.stringify(value)}`);
}

/** Exhaustive pattern match over any `_tag`-discriminated algebraic union. */
export function match<
  U extends Tagged<string>,
  const H extends {
    readonly [K in U['_tag']]: (variant: Extract<U, Tagged<K>>) => unknown;
  },
>(
  value: U,
  handlers: H & { readonly [K in Exclude<keyof H, U['_tag']>]: never },
): ReturnType<H[U['_tag']]> {
  const tag = value._tag as U['_tag'];
  const handler = handlers[tag] as (variant: U) => ReturnType<H[U['_tag']]>;
  if (!handler) {
    return assertNever(value as never);
  }
  return handler(value);
}

/** Total representation of optional values without null/undefined ambiguity. */
export type Option<A> =
  | { readonly _tag: 'Some'; readonly value: A }
  | { readonly _tag: 'None' };

export const none: Option<never> = { _tag: 'None' };

export function some<A>(value: A): Option<A> {
  return { _tag: 'Some', value };
}

export function fromNullable<A>(value: A | null | undefined): Option<A> {
  return value === null || value === undefined ? none : some(value);
}

export function mapOption<A, B>(option: Option<A>, fn: (value: A) => B): Option<B> {
  return match(option, {
    Some: ({ value }) => some(fn(value)),
    None: () => none,
  });
}

export function flatMapOption<A, B>(
  option: Option<A>,
  fn: (value: A) => Option<B>,
): Option<B> {
  return match(option, {
    Some: ({ value }) => fn(value),
    None: () => none,
  });
}

export function getOrElse<A>(option: Option<A>, fallback: () => A): A {
  return match(option, {
    Some: ({ value }) => value,
    None: fallback,
  });
}

/** Explicit success/failure sum type for pure domain validation and parsing. */
export type Result<A, E> =
  | { readonly _tag: 'Ok'; readonly value: A }
  | { readonly _tag: 'Err'; readonly error: E };

export function ok<A>(value: A): Result<A, never> {
  return { _tag: 'Ok', value };
}

export function err<E>(error: E): Result<never, E> {
  return { _tag: 'Err', error };
}

export function mapResult<A, B, E>(result: Result<A, E>, fn: (value: A) => B): Result<B, E> {
  return match(result, {
    Ok: ({ value }) => ok(fn(value)),
    Err: ({ error }) => err(error),
  });
}
