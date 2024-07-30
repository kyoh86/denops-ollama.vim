import type { Denops } from "jsr:@denops/std@7.0.0";
import * as bytes from "jsr:@std/fmt@0.225.6/bytes";
import { pullModel as pullModelAPI } from "../api.ts";
import { getLogger } from "jsr:@std/log@0.224.5";
import * as helper from "jsr:@denops/std@7.0.0/helper";
import { canceller } from "../util/cancellable.ts";
import { abortableAsyncIterable } from "jsr:@std/async@0.224.2";
import { isReqArgs } from "./types.ts";
import { is, type PredicateType } from "jsr:@core/unknownutil@3.18.1";

export const isPullModelArgs = is.AllOf([
  is.ObjectOf({
    name: is.String,
    insecure: is.OptionalOf(is.Boolean),
  }),
  isReqArgs,
]);

export type PullModelArgs = PredicateType<typeof isPullModelArgs>;

export async function pullModel(denops: Denops, args: PullModelArgs) {
  const { signal, cancel } = await canceller(denops, args?.timeout);
  try {
    const result = await pullModelAPI(
      name,
      { insecure: args.insecure },
      { baseUrl: args.baseUrl, signal },
    );
    if (!result.body) {
      return;
    }
    for await (
      const item of abortableAsyncIterable(result.body.values(), signal)
    ) {
      if ("error" in item) throw new Error(item.error);
      const words: string[] = [];
      if (item.total) {
        if (item.completed) {
          words.push(
            `${bytes.format(item.completed, { binary: true })}/${
              bytes.format(item.total, { binary: true })
            } (${Math.round(10000 * item.completed / item.total) / 100}%)`,
          );
        } else {
          words.push(`total: ${bytes.format(item.total, { binary: true })}`);
        }
      }
      words.push(item.status);
      await helper.echo(denops, `Pulling ${name}: ${words.join(" ")}`);
    }
    helper.echo(denops, `Pulled ${name}`);
  } catch (err) {
    getLogger("denops-ollama").error(err);
  } finally {
    await cancel();
  }
}
