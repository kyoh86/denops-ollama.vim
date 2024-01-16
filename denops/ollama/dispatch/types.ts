import {
  is,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.14.1/mod.ts";

export const isReqOpts = is.ObjectOf({
  baseUrl: is.OneOf([is.Undefined, is.String]),
});

export type ReqOpts = PredicateType<typeof isReqOpts>;
