import type { Denops } from "jsr:@denops/std@~7.0.1";

import { is, type PredicateType } from "jsr:@core/unknownutil@~3.18.1";
import { isOpener } from "../ui/open.ts";

export const isOpenLogArgs = is.ObjectOf({
  opener: is.OptionalOf(isOpener),
});
export type OpenLogArgs = PredicateType<typeof isOpenLogArgs>;

export async function openLog(
  denops: Denops,
  cacheFile: string,
  args: OpenLogArgs,
) {
  await denops.cmd(`${args?.opener ?? "tabnew"} ${cacheFile}`);
}
