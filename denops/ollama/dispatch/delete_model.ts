import { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import { deleteModel } from "../api.ts";
import { getLogger } from "https://deno.land/std@0.211.0/log/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v5.2.0/helper/mod.ts";

export default async function delete_model(
  denops: Denops,
  signal: AbortSignal,
  name: string,
) {
  try {
    await deleteModel({ name }, { init: { signal } });
    helper.echo(denops, `Deleted ${name}`);
  } catch (err) {
    getLogger("denops-ollama").error(err);
  }
}
