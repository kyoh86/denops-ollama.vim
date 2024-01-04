import { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";

import { listLocalModels } from "../api.ts";

export default async function list_models(
  _: Denops,
  __: AbortController,
) {
  const models = await listLocalModels();
  return models.body.models;
}
