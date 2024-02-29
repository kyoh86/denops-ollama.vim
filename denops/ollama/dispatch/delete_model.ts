import { type Denops } from "https://deno.land/x/denops_std@v6.1.0/mod.ts";
import { getLogger } from "https://deno.land/std@0.217.0/log/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v6.1.0/helper/mod.ts";
import {
  is,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

import { deleteModel as deleteModelAPI } from "../api.ts";
import { canceller } from "../util/cancellable.ts";
import { isReqArgs } from "./types.ts";

export const isDeleteModelArgs = is.AllOf([
  is.ObjectOf({
    name: is.String,
  }),
  isReqArgs,
]);
export type DeleteModelArgs = PredicateType<typeof isDeleteModelArgs>;

export async function deleteModel(denops: Denops, args: DeleteModelArgs) {
  const { signal, cancel } = await canceller(denops, args?.timeout);
  try {
    await deleteModelAPI(name, {}, { baseUrl: args.baseUrl, signal });
    helper.echo(denops, `Deleted ${name}`);
  } catch (err) {
    getLogger("denops-ollama").error(err);
  } finally {
    await cancel();
  }
}
