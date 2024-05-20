import * as datetime from "https://deno.land/std@0.224.0/datetime/mod.ts";
import * as bytes from "https://deno.land/std@0.224.0/fmt/bytes.ts";
import { Denops } from "https://deno.land/x/denops_std@v6.5.0/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v6.5.0/helper/mod.ts";
import { Table } from "https://deno.land/x/cliffy@v1.0.0-rc.4/table/mod.ts";

import { listLocalModels } from "../api.ts";
import { isReqArgs, ReqArgs } from "./types.ts";
import { canceller } from "../util/cancellable.ts";

export const isListModelsArgs = isReqArgs;
export type ListModelsArgs = ReqArgs;

export async function listModels(denops: Denops, args: ListModelsArgs) {
  const { signal, cancel } = await canceller(denops, args?.timeout);
  try {
    const { body } = await listLocalModels({ baseUrl: args.baseUrl, signal });
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
  } finally {
    await cancel();
  }
}
