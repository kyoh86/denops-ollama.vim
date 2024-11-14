import * as datetime from "jsr:@std/datetime@~0.225.0";
import * as bytes from "jsr:@std/fmt@~1.0.0/bytes";
import type { Denops } from "jsr:@denops/std@~7.3.0";
import * as helper from "jsr:@denops/std@~7.3.0/helper";
import { Table } from "jsr:@cliffy/table@^1.0.0-rc.7";

import { listLocalModels } from "../api.ts";
import { isReqArgs, type ReqArgs } from "./types.ts";
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
