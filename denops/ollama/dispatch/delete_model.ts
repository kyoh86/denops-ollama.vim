import { type Denops } from "https://deno.land/x/denops_std@v6.0.1/mod.ts";
import {
  deleteModel as deleteModelAPI,
  DeleteModelParams,
  isDeleteModelParams,
} from "../api.ts";
import { getLogger } from "https://deno.land/std@0.215.0/log/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v6.0.1/helper/mod.ts";
import { isReqOpts, ReqOpts } from "./types.ts";
export { type DeleteModelParams, isDeleteModelParams };

export const isDeleteModelOpts = isReqOpts;
export type DeleteModelOpts = ReqOpts;

export default async function deleteModel(
  denops: Denops,
  name: string,
  opts?: DeleteModelOpts,
  params?: DeleteModelParams,
) {
  try {
    await deleteModelAPI(name, params, { ...opts });
    helper.echo(denops, `Deleted ${name}`);
  } catch (err) {
    getLogger("denops-ollama").error(err);
  }
}
