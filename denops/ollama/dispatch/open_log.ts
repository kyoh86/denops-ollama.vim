import type { Denops } from "jsr:@denops/std@~7.2.0";

import { as, is, type PredicateType } from "jsr:@core/unknownutil@~4.3.0";
import { isOpener } from "../ui/open.ts";

export const isOpenLogArgs = is.ObjectOf({
  opener: as.Optional(isOpener),
});
export type OpenLogArgs = PredicateType<typeof isOpenLogArgs>;

export async function openLog(
  denops: Denops,
  cacheFile: string,
  args: OpenLogArgs,
) {
  await denops.cmd(`${args?.opener ?? "tabnew"} ${cacheFile}`);
}
