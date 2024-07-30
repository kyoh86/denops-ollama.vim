import { is, type PredicateType } from "jsr:@core/unknownutil@3.18.1";

export const isReqArgs = is.ObjectOf({
  timeout: is.OptionalOf(is.Number),
  baseUrl: is.OptionalOf(is.String),
});

export type ReqArgs = PredicateType<typeof isReqArgs>;
