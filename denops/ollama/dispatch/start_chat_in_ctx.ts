import { abortableAsyncIterable } from "jsr:@std/async@~1.0.1";
import type { Denops } from "jsr:@denops/std@~7.0.1";
import { is, maybe, type PredicateType } from "jsr:@core/unknownutil@~3.18.1";

import {
  generateChatCompletion,
  type GenerateChatCompletionMessage,
  isGenerateChatCompletionMessage,
} from "../api.ts";
import { isOpener } from "../ui/open.ts";
import { ChatBase } from "../ui/chat.ts";
import { isReqArgs } from "./types.ts";
import {
  getBuffer,
  getCurrentBuffer,
  getVisualSelection,
  isBufferInfo,
} from "../util/context.ts";

const isChatContext = is.ObjectOf({
  selection: is.OptionalOf(is.Boolean),
  currentBuffer: is.OptionalOf(is.Boolean),
  buffers: is.OptionalOf(is.ArrayOf(isBufferInfo)),
  // UNDONE: files: is.OptionalOf(is.ArrayOf(is.String)),
});
type ChatContext = PredicateType<typeof isChatContext>;

async function contextToMessages(
  denops: Denops,
  context: ChatContext,
): Promise<GenerateChatCompletionMessage[]> {
  const messages: GenerateChatCompletionMessage[] = [];
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
  return messages;
}

export const isStartChatInCtxArgs = is.AllOf([
  is.ObjectOf({
    model: is.String,
    context: isChatContext,
    opener: is.OptionalOf(isOpener),
    message: is.OptionalOf(is.String),
    // Additional model parameters listed in the documentation for the Modelfile such as temperature
    options: is.OptionalOf(is.Record),
  }),
  isReqArgs,
]);

export type StartChatInCtxArgs = PredicateType<
  typeof isStartChatInCtxArgs
>;

class Chat extends ChatBase<GenerateChatCompletionMessage[]> {
  constructor(
    model: string,
    messages: GenerateChatCompletionMessage[],
    private args: StartChatInCtxArgs,
  ) {
    super(model, args?.timeout, messages, args?.message);
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
      { options: this.args.options },
      { ...this.args, signal },
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

export async function startChatInCtx(
  denops: Denops,
  args: StartChatInCtxArgs,
) {
  const messages = await contextToMessages(denops, args.context);
  const chat = new Chat(args.model, messages, args);
  await chat.start(denops, args?.opener);
}
