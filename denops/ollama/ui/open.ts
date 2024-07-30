import { is, type PredicateType } from "jsr:@core/unknownutil@3.18.1";

export const isOpener = is.OneOf([
  is.LiteralOf("split"),
  is.LiteralOf("vsplit"),
  is.LiteralOf("tabnew"),
  is.LiteralOf("edit"),
  is.LiteralOf("new"),
  is.LiteralOf("vnew"),
]);

export type Opener = PredicateType<typeof isOpener>;
