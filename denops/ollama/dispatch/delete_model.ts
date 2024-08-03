import type { Denops } from "jsr:@denops/std@~7.0.1";
import { getLogger } from "jsr:@std/log@~0.224.5";
import * as helper from "jsr:@denops/std@~7.0.1/helper";
import { is, type PredicateType } from "jsr:@core/unknownutil@~3.18.1";

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
