import { abortableAsyncIterable } from "https://deno.land/std@0.212.0/async/mod.ts";
import { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import {
  is,
  maybe,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.14.1/mod.ts";

import { ChatBase, isOpener, type Opener } from "../util/chat.ts";
import {
  generateCompletion,
  type GenerateCompletionParams,
  isGenerateCompletionParams,
} from "../api.ts";
import { isReqOpts } from "./types.ts";
export {
  type GenerateCompletionParams,
  isGenerateCompletionParams,
  isOpener,
  type Opener,
};

class Chat extends ChatBase<number[]> {
  constructor(
    model: string,
    private opts?: StartChatOpts,
    private params?: GenerateCompletionParams,
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
      { ...this.opts, signal },
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

export const isStartChatOpts = is.AllOf([
  is.ObjectOf({
    opener: is.OptionalOf(isOpener),
    timeout: is.OptionalOf(is.Number),
  }),
  isReqOpts,
]);

export type StartChatOpts = PredicateType<typeof isStartChatOpts>;

export default async function startChat(
  denops: Denops,
  model: string,
  opts?: StartChatOpts,
  params?: GenerateCompletionParams,
) {
  const chat = new Chat(model, opts, params);
  await chat.start(denops, opts?.opener);
}
