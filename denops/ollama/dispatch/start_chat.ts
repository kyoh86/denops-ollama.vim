import { abortableAsyncIterable } from "https://deno.land/std@0.215.0/async/mod.ts";
import { Denops } from "https://deno.land/x/denops_std@v6.0.1/mod.ts";
import {
  is,
  maybe,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.15.0/mod.ts";

import { isOpener } from "../ui/open.ts";
import { ChatBase } from "../ui/chat.ts";
import {
  generateCompletion,
  type GenerateCompletionParams,
  isGenerateCompletionParams,
} from "../api.ts";
import { isReqOpts } from "./types.ts";
export { type GenerateCompletionParams, isGenerateCompletionParams };

export const isStartChatOpts = is.AllOf([
  is.ObjectOf({
    model: is.String,
    opener: is.OptionalOf(isOpener),
    initialPrompt: is.OptionalOf(is.String),
  }),
  isReqOpts,
]);

export type StartChatOpts = PredicateType<typeof isStartChatOpts>;

class Chat extends ChatBase<number[]> {
  constructor(
    private opts: StartChatOpts,
    private params?: GenerateCompletionParams,
  ) {
    super(opts.model, opts.timeout, undefined, opts.initialPrompt);
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

export async function startChat(
  denops: Denops,
  opts: StartChatOpts,
  params?: GenerateCompletionParams,
) {
  const chat = new Chat(opts, params);
  await chat.start(denops, opts?.opener);
}
