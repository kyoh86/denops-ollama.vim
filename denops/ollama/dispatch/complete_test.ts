import { assert } from "jsr:@std/assert@1.0.1";
import { complete } from "./complete.ts";

import { test } from "jsr:@denops/test@3.0.1";
export type Extends<E, A> = A extends E ? true : false;
export type NotExtends<E, A> = A extends E ? false : true;
export type Exact<A, B> = Extends<A, B> extends true
  ? Extends<B, A> extends true ? true
  : false
  : false;
export type Match<E, A extends E> = Exact<E, Pick<A, keyof E>>;
export type Never<T> = T extends never ? true : false;

export type Assert<T extends true> = T;
test({
  mode: "all",
  name: "msg",
  fn: async (denops) => {
    try {
      const x = await complete(
        denops,
        {
          model: "",
          callback: async (msg) => {
            await denops.cmd("echo 'hello'");
            return msg;
          },
        },
      );
      type _ = Assert<Exact<typeof x, string>>; // Core: assert type notation
    } catch (err) {
      assert(err); // model is required
    }
  },
});
