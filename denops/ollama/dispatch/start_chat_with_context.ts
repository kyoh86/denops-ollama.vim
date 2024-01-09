import { getLogger } from "https://deno.land/std@0.211.0/log/mod.ts";
import * as datetime from "https://deno.land/std@0.211.0/datetime/mod.ts";
import { abortableAsyncIterable } from "https://deno.land/std@0.211.0/async/mod.ts";
import { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v5.2.0/function/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v5.2.0/batch/batch.ts";
import * as option from "https://deno.land/x/denops_std@v5.2.0/option/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v5.2.0/helper/mod.ts";
import * as lambda from "https://deno.land/x/denops_std@v5.2.0/lambda/mod.ts";
import {
  ensure,
  is,
  maybe,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.13.0/mod.ts";

import type { Opener } from "./types.ts";
import {
  generateChatCompletion,
  type GenerateChatCompletionMessage,
  isGenerateChatCompletionMessage,
} from "../api.ts";
import PromptBufferEcho from "../util/prompt_buffer_echo.ts";
import BufferHighlight from "../util/buffer_highlight.ts";
import { canceller } from "../util/cancellable.ts";

const isBufferInfo = is.OneOf([
  is.Number,
  is.ObjectOf({
    bufnr: is.Number,
    name: is.String,
  }),
]);
type ChatContextBufferInfo = PredicateType<typeof isBufferInfo>;

export const isChatContext = is.ObjectOf({
  headMessage: is.OptionalOf(is.String),
  selection: is.OptionalOf(is.Boolean),
  currentBuffer: is.OptionalOf(is.Boolean),
  buffers: is.OptionalOf(is.ArrayOf(isBufferInfo)),
  // UNDONE: files: is.OptionalOf(is.ArrayOf(is.String)),
  lastMessasge: is.OptionalOf(is.String),
});
export type ChatContext = PredicateType<typeof isChatContext>;

async function getVisualSelection(denops: Denops) {
  // Why is this not a built-in Vim script function?!
  const [, line_start, column_start] = await fn.getpos(denops, "'<");
  const [, line_end, column_end] = await fn.getpos(denops, "'>");

  const lines = await fn.getline(denops, line_start, line_end);
  if (lines.length == 0) {
    return "";
  }
  const selection = await option.selection.get(denops);
  lines[lines.length - 1] = lines[-1].substring(
    0,
    column_end - (selection === "inclusive" ? 1 : 2),
  );

  lines[0] = lines[0].substring(column_start - 1);
  return lines.join("\n");
}

async function getBuffer(denops: Denops, buf: ChatContextBufferInfo) {
  if (typeof buf === "number") {
    const name = await fn.bufname(denops, buf);
    return {
      name,
      bufnr: buf,
      content: (await fn.getbufline(denops, buf, 1, "$")).join("\n"),
    };
  }
  return {
    ...buf,
    content: (await fn.getbufline(denops, buf.bufnr, 1, "$")).join("\n"),
  };
}

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
    const bufferContent = await fn.getline(denops, 1, "$");
    messages.push({
      role: "user",
      content: "Here is the contents in the current buffer:\n" +
        bufferContent.join("\n"),
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

export async function start_chat_with_context(
  denops: Denops,
  model: string,
  context: ChatContext,
  opener?: Opener,
) {
  const now = datetime.format(new Date(), "yyyy-MM-ddTHH-mm-ss.SSS");
  const bufname = `ollama://chat/${now}`;
  const messages = await contextToMessages(denops, context);

  await batch.batch(denops, async () => {
    const bufnr = await fn.bufadd(denops, bufname);
    await fn.setbufvar(denops, bufnr, "ollama_chat_context", messages);
    await option.filetype.setBuffer(denops, bufnr, "ollama.chat");
    await option.buftype.setBuffer(denops, bufnr, "prompt");
    await option.buflisted.setBuffer(denops, bufnr, true);
    await option.swapfile.setBuffer(denops, bufnr, false);
    await fn.bufload(denops, bufnr);

    const highlighter = new BufferHighlight(bufnr);
    await highlighter.setup(denops);

    await fn.prompt_setprompt(denops, bufnr, `(${model})>> `);
    await fn.prompt_setinterrupt(denops, bufnr, "ollama#internal#cancel");
    await denops.cmd(
      "call prompt_setcallback(bufnr, function('ollama#internal#notify_callback', [l:denops_name, l:lambda_id]))",
      {
        bufnr,
        denops_name: denops.name,
        lambda_id: lambda.register(
          denops,
          async (uPrompt) => {
            const prompt = ensure(uPrompt, is.String);
            await promptCallback(denops, highlighter, bufnr, model, prompt);
          },
        ),
      },
    );
    await helper.execute(denops, `${opener ?? "tabnew"} ${bufname}`);
    await helper.execute(denops, "setlocal wrap");
    await helper.execute(denops, "startinsert");

    await highlighter.markPrefix(denops, 2, `(${model})>> `);
  });
}

async function promptCallback(
  denops: Denops,
  highlighter: BufferHighlight,
  bufnr: number,
  model: string,
  prompt: string,
) {
  if (prompt === "exit") {
    await helper.execute(denops, `bdelete! ${bufnr}`);
    return;
  }
  getLogger("denops-ollama-verbose").debug(`prompt: ${prompt}`);

  const info = await fn.getbufinfo(denops, bufnr);
  highlighter.markPrefix(denops, info[0].linecount, `(${model})>> `);

  const messages = maybe(
    await fn.getbufvar(denops, bufnr, "ollama_chat_context"),
    is.ArrayOf(isGenerateChatCompletionMessage),
  ) || [];
  getLogger("denops-ollama-verbose").debug(`reserved messages: ${messages}`);

  messages.push({ role: "user", content: prompt });
  await fn.setbufvar(denops, bufnr, "ollama_chat_context", messages);

  const contents: string[] = [];
  const { signal, cancel } = await canceller(denops);
  try {
    const result = await generateChatCompletion({ model, messages }, {
      init: { signal },
    });
    if (!result.body) {
      return;
    }
    const p = new PromptBufferEcho(bufnr);
    for await (
      const item of abortableAsyncIterable(result.body.values(), signal)
    ) {
      if ("error" in item) throw new Error(item.error);
      if (!item.message) continue;

      // memory message history
      contents.push(item.message.content);

      // put response to buffer
      await p.put(denops, item.message.content);
    }

    // memory message history
    messages.push({
      role: "assistant",
      content: contents.join(""),
    });
    await fn.setbufvar(denops, bufnr, "ollama_chat_context", messages);
  } catch (err) {
    getLogger("denops-ollama").error(err);
  } finally {
    cancel();
    await fn.setbufvar(denops, bufnr, "&modified", 0);
  }
}
