import { abortableAsyncIterable } from "https://deno.land/std@0.211.0/async/mod.ts";
import { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import { is, maybe } from "https://deno.land/x/unknownutil@v3.13.0/mod.ts";

import { ChatBase, isOpener, type Opener } from "../util/chat.ts";
import {
  generateCompletion,
  type GenerateCompletionParam,
  isGenerateCompletionParam,
} from "../api.ts";
import { Options } from "./types.ts";
export {
  type GenerateCompletionParam,
  isGenerateCompletionParam,
  isOpener,
  type Opener,
};

class Chat extends ChatBase<number[]> {
  constructor(
    model: string,
    private params?: GenerateCompletionParam,
    private options?: Options,
  ) {
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
    const result = await generateCompletion(
      this.model,
      prompt,
      { ...this.params, context },
      { ...this.options, signal },
    );
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
  params?: GenerateCompletionParam,
  options?: Options,
) {
  const chat = new Chat(model, params, options);
  await chat.start(denops, opener);
}
