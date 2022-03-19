import { Result, Ok, Err } from "./result";

const Is = Symbol("Is");
const Val = Symbol("Value");

export type Some<T> = OptionType<T> & { [Is]: true };
export type None = OptionType<never> & { [Is]: false };
export type Option<T> = OptionType<T>;

type OptionTypes<O> = {
   [K in keyof O]: O[K] extends Option<infer T> ? T : never;
};

class OptionType<T> {
   readonly [Is]: boolean;
   readonly [Val]: T;

   constructor(val: T, some: boolean) {
      this[Val] = val;
      this[Is] = some;
      Object.freeze(this);
   }

   /**
    * Compares the Option to `cmp`, returns true if both are `Some` or both
    * are `None`. Acts as a type guard for `cmp is Option<unknown>`.
    *
    * ```
    * const s: Option<number> = Some(1);
    * const n: Option<number> = None;
    *
    * assert.equal(s.is(Some(10)), true);
    * assert.equal(n.is(None), true);
    * assert.equal(s.is(n), false);
    * ```
    */
   is(cmp: unknown): cmp is Option<unknown> {
      return cmp instanceof OptionType && this[Is] === cmp[Is];
   }

   /**
    * Return the contained `T`, or `null` if the Option is `None`.
    *
    * ```
    * const x: Option<number> = Some(1);
    * assert.equal(x.into(), 1);
    *
    * const x: Option<number> = None;
    * assert.equal(x.into(), null);
    * ```
    */
   into(): T | null {
      return this[Is] ? this[Val] : null;
   }

   /**
    * Compares the Option to `cmp` for equality. Returns `true` when both are
    * the same type (`Some`/`None`) and their contained values are identical
    * (`===`).
    *
    * const val = { x: 10 };
    * const s: Option<{ x: number; }> = Some(val);
    * const n: Option<{ x: number; }> = None;
    *
    * assert.equal(s.eq(Some(val)), true);
    * assert.equal(n.eq(None), true):
    * assert.equal(s.eq(Some({ x: 10 })), false);
    * assert.equal(s.eq(n), false);
    * ```
    */
   eq(cmp: Option<T>): boolean {
      return this[Is] === cmp[Is] && this[Val] === cmp[Val];
   }

   /**
    * Compares the Option to `cmp` for inequality. Returns true when both are
    * different types (`Some`/`None`) or their contained values are not
    * identical (`!==`).
    *
    * const val = { x: 10 };
    * const s: Option<{ x: number; }> = Some(val);
    * const n: Option<{ x: number; }> = None;
    *
    * assert.equal(s.neq(Some(val)), false);
    * assert.equal(n.neq(None), false);
    * assert.equal(s.neq(Some({ x: 10})), true);
    * assert.equal(s.new(n), true);
    * ```
    */
   neq(cmp: Option<T>): boolean {
      return this[Is] !== cmp[Is] || this[Val] !== cmp[Val];
   }

   /**
    * Returns true if the Option is `Some`. Acts as a type guard for
    * `this is Some<T>`.
    *
    * ```
    * const x = Some(10);
    * assert.equal(x.Is(), true);
    *
    * const x: Option<number> = None;
    * assert.equal(x.Is(), false);
    * ```
    */
   isSome(): this is Some<T> {
      return this[Is];
   }

   /**
    * Returns true if the Option is `None`. Acts as a type guard for
    * `this is None<never>`.
    *
    * ```
    * const x = Some(10);
    * assert.equal(x.isNone(), false);
    *
    * const x: Option<number> = None;
    * assert.equal(x.isNone(), true);
    * ```
    */
   isNone(): this is None {
      return !this[Is];
   }

   /**
    * Returns the contained `Some` value and throws `Error(msg)` if `None`.
    *
    * To avoid throwing, consider `Is`, `unwrapOr`, `unwrapOrElse` or
    * `match` to handle the `None` case.
    *
    * ```
    * const x = Some(1);
    * assert.equal(x.expect("Is empty"), 1);
    *
    * const x: Option<number> = None;
    * const y = x.expect("Is empty"); // throws
    * ```
    */
   expect(msg: string): T {
      if (this[Is]) {
         return this[Val];
      } else {
         throw new Error(msg);
      }
   }

   /**
    * Returns the contained `Some` value and throws if `None`.
    *
    * To avoid throwing, consider `Is`, `unwrapOr`, `unwrapOrElse` or
    * `match` to handle the `None` case. To throw a more informative error use
    * `expect`.
    *
    * ```
    * const x = Some(1);
    * assert.equal(x.unwrap(), 1);
    *
    * const x: Option<number> = None;
    * const y = x.unwrap(); // throws
    * ```
    */
   unwrap(): T {
      return this.expect("Failed to unwrap Option (found None)");
   }

   /**
    * Returns the contained `Some` value or a provided default.
    *
    * The provided default is eagerly evaluated. If you are passing the result
    * of a function call, consider `unwrapOrElse`, which is lazily evaluated.
    *
    * ```
    * const x = Some(10);
    * assert.equal(x.unwrapOr(1), 10);
    *
    * const x: Option<number> = None;
    * assert.equal(x.unwrapOr(1), 1);
    * ```
    */
   unwrapOr(def: T): T {
      return this[Is] ? this[Val] : def;
   }

   /**
    * Returns the contained `Some` value or computes it from a function.
    *
    * ```
    * const x = Some(10);
    * assert.equal(x.unwrapOrElse(() => 1 + 1), 10);
    *
    * const x: Option<number> = None;
    * assert.equal(x.unwrapOrElse(() => 1 + 1), 2);
    * ```
    */
   unwrapOrElse(f: () => T): T {
      return this[Is] ? this[Val] : f();
   }

   /**
    * Returns the contained `Some` value or undefined if `None`.
    *
    * Most problems are better solved using one of the other `unwrap_` methods.
    * This method should only be used when you are certain that you need it.
    *
    * ```
    * const x = Some(10);
    * assert.equal(x.unwrapUnchecked(), 10);
    *
    * const x: Option<number> = None;
    * assert.equal(x.unwrapUnchecked(), undefined);
    * ```
    */
   unwrapUnchecked(): T | undefined {
      return this[Val];
   }

   /**
    * Returns the Option if it is `Some`, otherwise returns `optb`.
    *
    * `optb` is eagerly evaluated. If you are passing the result of a function
    * call, consider `orElse`, which is lazily evaluated.
    *
    * ```
    * const x = Some(10);
    * const xor = x.or(Some(1));
    * assert.equal(xor.unwrap(), 10);
    *
    * const x: Option<number> = None;
    * const xor = x.or(Some(1));
    * assert.equal(xor.unwrap(), 1);
    * ```
    */
   or(optb: Option<T>): Option<T> {
      return this[Is] ? this : optb;
   }

   /**
    * Returns the Option if it is `Some`, otherwise returns the value of `f()`.
    *
    * ```
    * const x = Some(10);
    * const xor = x.orElse(() => Some(1));
    * assert.equal(xor.unwrap(), 10);
    *
    * const x: Option<number> = None;
    * const xor = x.orElse(() => Some(1));
    * assert.equal(xor.unwrap(), 1);
    * ```
    */
   orElse(f: () => Option<T>): Option<T> {
      return this[Is] ? this : f();
   }

   /**
    * Returns `None` if the Option is `None`, otherwise returns `optb`.
    *
    * ```
    * const x = Some(10);
    * const xand = x.and(Some(1));
    * assert.equal(xand.unwrap(), 1);
    *
    * const x: Option<number> = None;
    * const xand = x.and(Some(1));
    * assert.equal(xand.isNone(), true);
    *
    * const x = Some(10);
    * const xand = x.and(None);
    * assert.equal(xand.isNone(), true);
    * ```
    */
   and<U>(optb: Option<U>): Option<U> {
      return this[Is] ? optb : None;
   }

   /**
    * Returns `None` if the option is `None`, otherwise calls `f` with the
    * `Some` value and returns the result.
    *
    * ```
    * const x = Some(10);
    * const xand = x.andThen((n) => n + 1);
    * assert.equal(xand.unwrap(), 11);
    *
    * const x: Option<number> = None;
    * const xand = x.andThen((n) => n + 1);
    * assert.equal(xand.isNone(), true);
    *
    * const x = Some(10);
    * const xand = x.andThen(() => None);
    * assert.equal(xand.isNone(), true);
    * ```
    */
   andThen<U>(f: (val: T) => Option<U>): Option<U> {
      return this[Is] ? f(this[Val]) : None;
   }

   /**
    * Maps an `Option<T>` to `Option<U>` by applying a function to the `Some`
    * value.
    *
    * ```
    * const x = Some(10);
    * const xmap = x.map((n) => `number ${n}`);
    * assert.equal(xmap.unwrap(), "number 10");
    * ```
    */
   map<U>(f: (val: T) => U): Option<U> {
      return this[Is] ? new OptionType(f(this[Val]), true) : None;
   }

   /**
    * Returns the provided default if `None`, otherwise calls `f` with the
    * `Some` value and returns the result.
    *
    * The provided default is eagerly evaluated. If you are passing the result
    * of a function call, consider `mapOrElse`, which is lazily evaluated.
    *
    * ```
    * const x = Some(10);
    * const xmap = x.mapOr(1, (n) => n + 1);
    * assert.equal(xmap.unwrap(), 11);
    *
    * const x: Option<number> = None;
    * const xmap = x.mapOr(1, (n) => n + 1);
    * assert.equal(xmap.unwrap(), 1);
    * ```
    */
   mapOr<U>(def: U, f: (val: T) => U): U {
      return this[Is] ? f(this[Val]) : def;
   }

   /**
    * Computes a default return value if `None`, otherwise calls `f` with the
    * `Some` value and returns the result.
    *
    * const x = Some(10);
    * const xmap = x.mapOrElse(() => 1 + 1, (n) => n + 1);
    * assert.equal(xmap.unwrap(), 11);
    *
    * const x: Option<number> = None;
    * const xmap = x.mapOrElse(() => 1 + 1, (n) => n + 1);
    * assert.equal(xmap.unwrap(), 2);
    * ```
    */
   mapOrElse<U>(def: () => U, f: (val: T) => U): U {
      return this[Is] ? f(this[Val]) : def();
   }

   /**
    * Transforms the `Option<T>` into a `Result<T, E>`, mapping `Some(v)` to
    * `Ok(v)` and `None` to `Err(err)`.
    *
    * ```
    * const x = Some(10);
    * const res = x.okOr("Is empty");
    * assert.equal(x.isOk(), true);
    * assert.equal(x.unwrap(), 10);
    *
    * const x: Option<number> = None;
    * const res = x.okOr("Is empty");
    * assert.equal(x.isErr(), true);
    * assert.equal(x.unwrap_err(), "Is empty");
    * ```
    */
   okOr<E>(err: E): Result<T, E> {
      return this[Is] ? Ok<T, E>(this[Val]) : Err<E, T>(err);
   }

   /**
    * Transforms the `Option<T>` into a `Result<T, E>`, mapping `Some(v)` to
    * `Ok(v)` and `None` to `Err(f())`.
    *
    * ```
    * const x = Some(10);
    * const res = x.okOrElse(() => ["Is", "empty"].join(" "));
    * assert.equal(x.isOk(), true);
    * assert.equal(x.unwrap(), 10);
    *
    * const x: Option<number> = None;
    * const res = x.okOrElse(() => ["Is", "empty"].join(" "));
    * assert.equal(x.isErr(), true);
    * assert.equal(x.unwrap_err(), "Is empty");
    * ```
    */
   okOrElse<E>(f: () => E): Result<T, E> {
      return this[Is] ? Ok<T, E>(this[Val]) : Err<E, T>(f());
   }
}

/**
 * An Option represents either something, or nothing. If we hold a value
 * of type `Option<T>`, we know it is either `Some<T>` or `None`.
 *
 * ```
 * const users = ["Simon", "Garfunkel"];
 * function fetch_user(username: string): Option<string> {
 *    return users.includes(username) ? Some(username) : None;
 * }
 *
 * function greet(username: string): string {
 *    return fetch_user(username)
 *       .map((user) => `Hello ${user}, my old friend!`)
 *       .unwrapOr("*silence*");
 * }
 *
 * assert.equal(greet("Simon"), "Hello Simon, my old friend!")
 * assert.equal(greet("SuperKing77"), "*silence*");
 * ```
 */
export function Option<T>(val: T): Option<NonNullable<T>> {
   return from(val);
}

/**
 * Creates a `Some<T>` value, which can be used where an `Option<T>` is
 * required. See Option for more examples.
 *
 * ```
 * const x = Some(10);
 * assert.equal(x.isSome(), true);
 * assert.equal(x.unwrap(), 10);
 * ```
 */
export function Some<T>(val: T): Some<T> {
   return new OptionType(val, true) as Some<T>;
}

/**
 * The `None` value, which can be used where an `Option<T>` is required.
 * See Option for more examples.
 *
 * ```
 * const x = None;
 * assert.equal(x.isNone(), true);
 * const y = x.unwrap(); // throws
 * ```
 */
export const None = new OptionType<never>(undefined as never, false);

/**
 * Tests the provided `val` is an Option. Acts as a type guard for
 * `val is Option<unknown>`.
 *
 * ```
 * assert.equal(Option.is(Some(1), true);
 * assert.equal(Option.is(None, true));
 * assert.equal(Option.is(Ok(1), false));
 * ```
 */
Option.is = is;
function is(val: unknown): val is Option<unknown> {
   return val instanceof OptionType;
}

/**
 * @todo Docs for Option.from
 */
Option.from = from;
function from<T>(val: T): Option<NonNullable<T>> {
   return val === undefined || val === null || val !== val
      ? None
      : Some(val as NonNullable<T>);
}

/**
 * Capture the outcome of a function or Promise as an `Option<T>`, preventing
 * throwing (function) or rejection (Promise).
 *
 * ### Usage for functions
 *
 * Calls `fn` with the provided `args` and returns an `Option<T>`. The Option
 * is `Some` if the provided function returned, or `None` if it threw.
 *
 * **Note:** Any function which returns a Promise (or PromiseLike) value is
 * rejected by the type signature. `Option<Promise<T>>` is not a useful type,
 * and using it in this way is likely to be a mistake.
 *
 * ```
 * function mightThrow(throws: boolean) {
 *    if (throws) {
 *       throw new Error("Throw");
 *    }
 *    return "Hello World";
 * }
 *
 * const x: Option<string> = Option.safe(mightThrow, true);
 * assert.equal(x.isNone(), true);
 *
 * const x = Option.safe(() => mightThrow(false));
 * assert.equal(x.unwrap(), "Hello World");
 * ```
 *
 * ### Usage for Promises
 *
 * Accepts `promise` and returns a new Promise which always resolves to
 * `Option<T>`. The Result is `Some` if the original promise resolved, or
 * `None` if it rejected.
 *
 * ```
 * async function mightThrow(throws: boolean) {
 *    if (throws) {
 *       throw new Error("Throw")
 *    }
 *    return "Hello World";
 * }
 *
 * const x = await Option.safe(mightThrow(true));
 * assert.equal(x.isNone(), true);
 *
 * const x = await Option.safe(mightThrow(false));
 * assert.equal(x.unwrap(), "Hello World");
 * ```
 */
Option.safe = safe;
function safe<T, A extends any[]>(
   fn: (...args: A) => T extends PromiseLike<any> ? never : T,
   ...args: A
): Option<T>;
function safe<T>(promise: Promise<T>): Promise<Option<T>>;
function safe<T, A extends any[]>(
   fn: ((...args: A) => T) | Promise<T>,
   ...args: A
): Option<T> | Promise<Option<T>> {
   if (fn instanceof Promise) {
      return fn.then(
         (value) => Some(value),
         () => None
      );
   }

   try {
      return Some(fn(...args));
   } catch (err) {
      return None;
   }
}

/**
 * Converts a number of `Option`s into a single Option. If any of the provided
 * Options are `None` then the new Option is also None. Otherwise the new
 * Option is `Some` and contains an array of all the unwrapped values.
 *
 * ```
 * function num(val: number): Option<number> {
 *    return val > 10 ? Some(val) : None;
 * }
 *
 * const xyz = Option.all(num(20), num(30), num(40));
 * const [x, y, z] = xyz.unwrap();
 * assert.equal(x, 20);
 * assert.equal(y, 30);
 * assert.equal(z, 40);
 *
 * const x = Option.all(num(20), num(5), num(40));
 * assert.equal(x.isNone(), true);
 * ```
 */
Option.all = all;
function all<O extends Option<any>[]>(...options: O): Option<OptionTypes<O>> {
   const some = [];
   for (const option of options) {
      if (option.isSome()) {
         some.push(option.unwrapUnchecked());
      } else {
         return None;
      }
   }

   return Some(some) as Some<OptionTypes<O>>;
}

/**
 * Converts a number of `Options`s into a single Option. The first `Some` found
 * (if any) is returned, otherwise the new Option is `None`.
 *
 * ```
 * function num(val: number): Option<number> {
 *    return val > 10 ? Some(val) : None;
 * }
 *
 * const x = Option.any(num(5), num(20), num(2));
 * assert.equal(x.unwrap(), 20);
 *
 * const x = Option.any(num(2), num(5), num(8));
 * assert.equal(x.isNone(), true);
 * ```
 */
Option.any = any;
function any<O extends Option<any>[]>(
   ...options: O
): Option<OptionTypes<O>[number]> {
   for (const option of options) {
      if (option.isSome()) {
         return option;
      }
   }
   return None;
}

Object.freeze(Some);
Object.freeze(None);
Object.freeze(Option);
Object.freeze(OptionType);
Object.freeze(OptionType.prototype);
Object.freeze(is);
Object.freeze(from);
Object.freeze(safe);
Object.freeze(all);
Object.freeze(any);
