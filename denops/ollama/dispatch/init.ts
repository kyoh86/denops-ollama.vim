import { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";

import { setup as setupHighlight } from "../ui/highlight_prefix.ts";
import { mapCancel } from "../util/cancellable.ts";

export default async function init(denops: Denops) {
  await mapCancel(denops);
  await setupHighlight(denops);
}
