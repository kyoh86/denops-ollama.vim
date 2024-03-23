import { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";

import {
  is,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.17.0/mod.ts";
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
