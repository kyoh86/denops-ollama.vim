import {
  is,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.15.0/mod.ts";

export const isReqOpts = is.ObjectOf({
  timeout: is.OptionalOf(is.Number),
  baseUrl: is.OptionalOf(is.String),
});

export type ReqOpts = PredicateType<typeof isReqOpts>;
