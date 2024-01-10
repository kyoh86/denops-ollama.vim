import { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import * as bytes from "https://deno.land/std@0.211.0/fmt/bytes.ts";
import {
  isPullModelParams,
  pullModel as pullModelAPI,
  type PullModelParams,
} from "../api.ts";
import { getLogger } from "https://deno.land/std@0.211.0/log/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v5.2.0/helper/mod.ts";
import { canceller } from "../util/cancellable.ts";
import { abortableAsyncIterable } from "https://deno.land/std@0.211.0/async/mod.ts";
import { isReqOpts } from "./types.ts";
import {
  is,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.13.0/mod.ts";

export { isPullModelParams, type PullModelParams };

export const isPullModelOpts = is.AllOf([
  is.ObjectOf({
    insecure: is.OptionalOf(is.Boolean),
  }),
  isReqOpts,
]);

export type PullModelOpts = PredicateType<typeof isPullModelOpts>;

export default async function pullModel(
  denops: Denops,
  name: string,
  opts?: PullModelOpts,
  params?: PullModelParams,
) {
  const { signal, cancel } = await canceller(denops);
  try {
    const result = await pullModelAPI(
      name,
      params,
      { ...opts, signal },
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
    cancel();
  }
}
