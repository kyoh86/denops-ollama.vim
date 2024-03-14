import {
  is,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.17.0/mod.ts";

export const isOpener = is.OneOf([
  is.LiteralOf("split"),
  is.LiteralOf("vsplit"),
  is.LiteralOf("tabnew"),
  is.LiteralOf("edit"),
  is.LiteralOf("new"),
  is.LiteralOf("vnew"),
]);

export type Opener = PredicateType<typeof isOpener>;
