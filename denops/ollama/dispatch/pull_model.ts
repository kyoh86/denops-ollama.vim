import { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import { pullModel, PullModelResponse } from "../api.ts";
import { getLogger } from "https://deno.land/std@0.210.0/log/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v5.2.0/helper/mod.ts";

function formatResponseItem(item: PullModelResponse) {
  const words: string[] = [];
  if (item.total) {
    if (item.completed) {
      words.push(
        `${item.completed}/${item.total} bytes (${
          Math.round(10000 * item.completed / item.total) / 100
        }%)`,
      );
    } else {
      words.push(`total: ${item.total} bytes`);
    }
  }
  words.push(item.status);
  return words.join(" ");
}

export default async function pull_model(
  denops: Denops,
  signal: AbortSignal,
  name: string,
  insecure?: boolean,
) {
  const writer = new WritableStream<PullModelResponse>({
    write: async (item) => {
      await helper.echo(denops, `Pulling ${name}: ${formatResponseItem(item)}`);
    },
  });

  try {
    const result = await pullModel({ name, insecure }, { init: { signal } });
    if (!result.body) {
      return;
    }
    await result.body.pipeTo(writer);
    helper.echo(denops, `Pulled ${name}`);
  } catch (err) {
    getLogger("denops-ollama").error(err);
  }
}
