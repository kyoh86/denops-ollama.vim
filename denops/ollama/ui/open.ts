import { is, type PredicateType } from "jsr:@core/unknownutil@~4.0.0";

export const isOpener = is.UnionOf([
  is.LiteralOf("split"),
  is.LiteralOf("vsplit"),
  is.LiteralOf("tabnew"),
  is.LiteralOf("edit"),
  is.LiteralOf("new"),
  is.LiteralOf("vnew"),
]);

export type Opener = PredicateType<typeof isOpener>;
