import { as, is, type PredicateType } from "jsr:@core/unknownutil@~4.3.0";

export const isReqArgs = is.ObjectOf({
  timeout: as.Optional(is.Number),
  baseUrl: as.Optional(is.String),
});

export type ReqArgs = PredicateType<typeof isReqArgs>;
