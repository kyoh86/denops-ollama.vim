import { type Denops } from "https://deno.land/x/denops_std@v6.0.1/mod.ts";
import {
  deleteModel as deleteModelAPI,
  DeleteModelParams,
  isDeleteModelParams,
} from "../api.ts";
import { getLogger } from "https://deno.land/std@0.215.0/log/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v6.0.1/helper/mod.ts";
import { isReqOpts } from "./types.ts";
import {
  is,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.14.1/mod.ts";
export { type DeleteModelParams, isDeleteModelParams };

export const isDeleteModelOpts = is.AllOf([
  is.ObjectOf({
    name: is.String,
  }),
  isReqOpts,
]);
export type DeleteModelOpts = PredicateType<typeof isDeleteModelOpts>;

export async function deleteModel(
  denops: Denops,
  opts: DeleteModelOpts,
  params?: DeleteModelParams,
) {
  try {
    await deleteModelAPI(name, params, { ...opts });
    helper.echo(denops, `Deleted ${name}`);
  } catch (err) {
    getLogger("denops-ollama").error(err);
  }
}
