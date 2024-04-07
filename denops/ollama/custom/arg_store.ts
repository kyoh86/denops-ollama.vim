import {
  is,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.17.2/mod.ts";

export const isArgs = is.RecordOf(is.Unknown, is.String);
export type CustomArgs = PredicateType<typeof isArgs>;

// A marker instead of the func-name to specify args cross all functions.
export type CustomCrossFunc = "_";

export class CustomArgStore {
  #store = new Map<string | CustomCrossFunc, CustomArgs>();

  /**
   * Set an arg value for a function (or cross all functions).
   * @param {string} func - Target function name or "_" to cross all functions.
   * @param {string} arg - Target arg name.
   * @param {unknown} value
   */
  public setFuncArg(
    func: string | CustomCrossFunc,
    arg: string,
    value: unknown,
  ) {
    const args = this.#store.get(func) || {};
    args[arg] = value;
    this.#store.set(func, args);
  }

  /**
   * Patch args for a function (or cross all functions).
   * @param {string} func - Target function name or "_" to cross all functions.
   * @param {Record<string, unknown>} args - A record holding arg name and value pairs.
   */
  public patchFuncArgs(func: string | CustomCrossFunc, args: CustomArgs) {
    const old = this.#store.get(func) || {};
    this.#store.set(func, { old, ...args });
  }

  /** Patch args for everything. */
  public patchArgs(argSet: Record<string | CustomCrossFunc, CustomArgs>) {
    for (const func in argSet) {
      const old = this.#store.get(func) || {};
      this.#store.set(func, { old, ...argSet[func] });
    }
  }

  /**
   * Get stored args for a function.
   * @param {string} func - Target function name.
   * @param {Record<string, unknown>} [override] - A record hoding instant arg name and value paris
   */
  public getArgs(func: string, override?: CustomArgs): CustomArgs {
    const cross = this.#store.get("_") || {};
    const target = this.#store.get(func) || {};
    return {
      ...cross,
      ...target,
      ...override,
    };
  }
}
