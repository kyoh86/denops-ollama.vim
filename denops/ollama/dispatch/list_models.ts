import * as datetime from "https://deno.land/std@0.211.0/datetime/mod.ts";
import * as bytes from "https://deno.land/std@0.211.0/fmt/bytes.ts";
import { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v5.2.0/helper/mod.ts";
import { Table } from "https://deno.land/x/cliffy@v1.0.0-rc.3/table/mod.ts";
import { listLocalModels } from "../api.ts";
import { isReqOpts, ReqOpts } from "./types.ts";

export const isListModelsOpts = isReqOpts;
export type ListModelsOpts = ReqOpts;

export default async function listModels(
  denops: Denops,
  opts?: ListModelsOpts,
) {
  const { body } = await listLocalModels({ ...opts });
  if ("error" in body) {
    helper.echoerr(denops, body.error);
    return;
  }
  const table = Table.fromJson(
    body.models.map((model) => {
      return {
        NAME: model.name,
        ID: model.digest.slice(0, 12),
        SIZE: bytes.format(model.size, { binary: true }),
        MODIFIED: datetime.format(
          new Date(model.modified_at),
          "yyyy-MM-dd HH:mm:ss",
        ),
      };
    }),
  );
  table.padding(2);
  helper.echo(denops, table.toString());
}
