import { abortableAsyncIterable } from "https://deno.land/std@0.212.0/async/mod.ts";
import { type Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import {
  is,
  maybe,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.14.1/mod.ts";

import {
  generateChatCompletion,
  type GenerateChatCompletionMessage,
  type GenerateChatCompletionParams,
  isGenerateChatCompletionMessage,
  isGenerateChatCompletionParams,
} from "../api.ts";
import { ChatBase, isOpener, type Opener } from "../util/chat.ts";
import { isReqOpts } from "./types.ts";
import {
  getBuffer,
  getCurrentBuffer,
  getVisualSelection,
  isBufferInfo,
} from "../util/context.ts";

export {
  type GenerateChatCompletionParams,
  isGenerateChatCompletionParams,
  isOpener,
  type Opener,
};

export const isChatContext = is.ObjectOf({
  headMessage: is.OptionalOf(is.String),
  selection: is.OptionalOf(is.Boolean),
  currentBuffer: is.OptionalOf(is.Boolean),
  buffers: is.OptionalOf(is.ArrayOf(isBufferInfo)),
  // UNDONE: files: is.OptionalOf(is.ArrayOf(is.String)),
  lastMessasge: is.OptionalOf(is.String),
});
export type ChatContext = PredicateType<typeof isChatContext>;

async function contextToMessages(
  denops: Denops,
  context: ChatContext,
): Promise<GenerateChatCompletionMessage[]> {
  const messages: GenerateChatCompletionMessage[] = [];
  if (context.headMessage) {
    messages.push({ role: "user", content: context.headMessage });
  }
  if (context.selection) {
    const selection = await getVisualSelection(denops);
    if (selection && selection !== "") {
      messages.push({
        role: "user",
        content: "Here is selecting text:\n" + selection,
      });
    }
  }
  if (context.currentBuffer) {
    const buffer = await getCurrentBuffer(denops);
    messages.push({
      role: "user",
      content:
        `Here is the contents in ${buffer.name} as the current buffer:\n` +
        buffer.content,
    });
  }
  for (const buf of context.buffers ?? []) {
    const buffer = await getBuffer(denops, buf);
    messages.push({
      role: "user",
      content:
        `Here is the file ${buffer.name} being opened in the buffer ${buffer.bufnr} with the contents:\n${buffer.content}`,
    });
  }
  // UNDONE: files
  if (context.lastMessasge) {
    messages.push({
      role: "user",
      content: context.lastMessasge,
    });
  }
  return messages;
}

class Chat extends ChatBase<GenerateChatCompletionMessage[]> {
  constructor(
    model: string,
    messages: GenerateChatCompletionMessage[],
    private opts?: StartChatWithContextOpts,
    private params?: GenerateChatCompletionParams,
  ) {
    super(model, opts?.timeout, messages);
  }

  parseContext(context: unknown): GenerateChatCompletionMessage[] | undefined {
    return maybe(context, is.ArrayOf(isGenerateChatCompletionMessage));
  }
  async process(
    denops: Denops,
    bufnr: number,
    context: GenerateChatCompletionMessage[] | undefined,
    signal: AbortSignal,
    prompt: string,
  ): Promise<void> {
    const contents: string[] = [];
    const messages = [...context ?? [], { role: "user", content: prompt }];

    const result = await generateChatCompletion(
      this.model,
      messages,
      this.params,
      { ...this.opts, signal },
    );
    if (!result.body) {
      return;
    }
    for await (
      const item of abortableAsyncIterable(result.body.values(), signal)
    ) {
      if ("error" in item) throw new Error(item.error);
      if (!item.message) continue;

      // memory message history
      contents.push(item.message.content);

      // put response to buffer
      await this.echo(denops, bufnr, item.message.content);
    }

    // memory message history
    await this.setContext(denops, bufnr, [...messages, {
      role: "assistant",
      content: contents.join(""),
    }]);
  }
}

export const isStartChatWithContextOpts = is.AllOf([
  is.ObjectOf({
    opener: is.OptionalOf(isOpener),
    timeout: is.OptionalOf(is.Number),
  }),
  isReqOpts,
]);

export type StartChatWithContextOpts = PredicateType<
  typeof isStartChatWithContextOpts
>;

export async function startChatWithContext(
  denops: Denops,
  model: string,
  context: ChatContext,
  opts?: StartChatWithContextOpts,
  params?: GenerateChatCompletionParams,
) {
  const messages = await contextToMessages(denops, context);
  const chat = new Chat(model, messages, opts, params);
  await chat.start(denops, opts?.opener);
}
