import { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import * as bytes from "https://deno.land/std@0.211.0/fmt/bytes.ts";
import { pullModel } from "../api.ts";
import { getLogger } from "https://deno.land/std@0.211.0/log/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v5.2.0/helper/mod.ts";
import { canceller } from "../util/cancellable.ts";
import { abortableAsyncIterable } from "https://deno.land/std@0.203.0/async/mod.ts";

export default async function pull_model(
  denops: Denops,
  name: string,
  insecure?: boolean,
) {
  const { signal, cancel } = await canceller(denops);
  try {
    const result = await pullModel({ name, insecure }, { init: { signal } });
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
