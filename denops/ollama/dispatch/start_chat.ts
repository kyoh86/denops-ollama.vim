import { abortableAsyncIterable } from "https://deno.land/std@0.211.0/async/mod.ts";
import { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import { is, maybe } from "https://deno.land/x/unknownutil@v3.13.0/mod.ts";

import { ChatBase, type Opener } from "../util/chat.ts";
import { generateCompletion } from "../api.ts";

class Chat extends ChatBase<number[]> {
  constructor(model: string) {
    // TODO: support options
    super(model);
  }

  parseContext(context: unknown): number[] | undefined {
    return maybe(context, is.ArrayOf(is.Number));
  }

  async process(
    denops: Denops,
    bufnr: number,
    context: number[] | undefined,
    signal: AbortSignal,
    prompt: string,
  ): Promise<void> {
    const result = await generateCompletion(this.model, prompt, { context }, {
      signal,
    });
    if (!result.body) {
      return;
    }
    for await (
      const item of abortableAsyncIterable(result.body.values(), signal)
    ) {
      if ("error" in item) throw new Error(item.error);

      // memory completion context
      if (item.context) {
        await this.setContext(denops, bufnr, item.context);
      }

      // put response to buffer
      await this.echo(denops, bufnr, item.response);
    }
  }
}

export default async function startChat(
  denops: Denops,
  model: string,
  opener?: Opener,
) {
  const chat = new Chat(model);
  await chat.start(denops, opener);
}
