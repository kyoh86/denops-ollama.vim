import { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import { deleteModel as deleteModelAPI } from "../api.ts";
import { getLogger } from "https://deno.land/std@0.211.0/log/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v5.2.0/helper/mod.ts";

export default async function deleteModel(
  denops: Denops,
  name: string,
) {
  try {
    await deleteModelAPI({ name });
    helper.echo(denops, `Deleted ${name}`);
  } catch (err) {
    getLogger("denops-ollama").error(err);
  }
}
