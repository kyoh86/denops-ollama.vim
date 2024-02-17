import {
  is,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

export const isReqArgs = is.ObjectOf({
  timeout: is.OptionalOf(is.Number),
  baseUrl: is.OptionalOf(is.String),
});

export type ReqArgs = PredicateType<typeof isReqArgs>;
