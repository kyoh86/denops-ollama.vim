import { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import {
  ensure,
  is,
  maybe,
  ObjectOf as O,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";
import {
  generateChatCompletion,
  GenerateChatCompletionResponse,
} from "../api.ts";
import { Opener } from "./types.ts";
import { getLogger } from "https://deno.land/std@0.210.0/log/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v5.2.0/function/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v5.2.0/batch/batch.ts";
import * as option from "https://deno.land/x/denops_std@v5.2.0/option/mod.ts";
import * as datetime from "https://deno.land/std@0.210.0/datetime/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v5.2.0/helper/mod.ts";
import * as lambda from "https://deno.land/x/denops_std@v5.2.0/lambda/mod.ts";

const isBufferInfo = is.OneOf([
  is.Number,
  is.ObjectOf({
    bufnr: is.Number,
    name: is.String,
  }),
]);
type ChatContextBufferInfo = PredicateType<typeof isBufferInfo>;

const chatContextFields = {
  headMessage: is.OptionalOf(is.String),
  selection: is.OptionalOf(is.Boolean),
  currentBuffer: is.OptionalOf(is.Boolean),
  buffers: is.OptionalOf(is.ArrayOf(isBufferInfo)),
  files: is.OptionalOf(is.ArrayOf(is.String)),
  lastMessasge: is.OptionalOf(is.String),
};

export type ChatContext = O<typeof chatContextFields>;
export const isChatContext = is.ObjectOf(chatContextFields);

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
      content: await fn.getbufline(denops, buf, 1, "$"),
    };
  }
  return {
    ...buf,
    content: await fn.getbufline(denops, buf.bufnr, 1, "$"),
  };
}

async function contextToMessages(
  denops: Denops,
  context?: ChatContext,
): Promise<string[]> {
  if (!context) {
    return [];
  }
  const messages: string[] = [];
  if (context.headMessage) {
    messages.push(context.headMessage);
  }
  if (context.selection) {
    const selection = await getVisualSelection(denops);
    if (selection && selection !== "") {
      messages.push("Now I'm selecting text:\n" + selection);
    }
  }
  if (context.currentBuffer) {
    const bufferContent = await fn.getline(denops, 1, "$");
    messages.push("Now I'm in the buffer with the contents:\n" + bufferContent);
  }
  for (const buf of context.buffers ?? []) {
    const buffer = await getBuffer(denops, buf);
    messages.push(
      `Now the file ${buffer.name} being opened in the buffer ${buffer.bufnr} with the contents:\n${buffer.content}`,
    );
  }
  // TODO: files
  if (context.lastMessasge) {
    messages.push(context.lastMessasge);
  }
  return messages;
}

export async function start_chat_with_context(
  denops: Denops,
  signal: AbortSignal,
  model: string,
  opener?: Opener,
  context?: ChatContext,
) {
  //TODO: convert context to chat message
  const now = datetime.format(new Date(), "yyyy-MM-ddTHH-mm-ss.SSS");
  const bufname = `ollama://chat/${now}`;
  const bufnr = await fn.bufadd(denops, bufname);

  await batch.batch(denops, async () => {
    await option.filetype.setBuffer(
      denops,
      bufnr,
      "ollama.chat",
    );
    await option.buftype.setBuffer(denops, bufnr, "prompt");
    await option.buflisted.setBuffer(denops, bufnr, true);
    await option.swapfile.setBuffer(denops, bufnr, false);
    await fn.bufload(denops, bufnr);
    await fn.setbufline(denops, bufnr, 1, [
      "Enter the prompt:",
    ]);
    await fn.prompt_setprompt(denops, bufnr, `(${model})>> `);
    await denops.cmd(
      "call prompt_setcallback(bufnr, function('ollama#internal#callback_helper', [denops_name, lambda_id]))",
      {
        bufnr,
        denops_name: denops.name,
        lambda_id: lambda.register(
          denops,
          async (uPrompt) => {
            const prompt = ensure(uPrompt, is.String);
            await promptCallback(denops, signal, bufnr, model, prompt);
          },
        ),
      },
    );
    await helper.execute(denops, `${opener ?? "tabnew"} ${bufname}`);
    await helper.execute(denops, "setlocal wrap");
    await helper.execute(denops, "startinsert");
  });
}

async function promptCallback(
  denops: Denops,
  signal: AbortSignal,
  bufnr: number,
  model: string,
  prompt: string,
) {
  const context = maybe(
    await fn.getbufvar(
      denops,
      bufnr,
      "ollama_generate_completion_context",
    ),
    is.ArrayOf(is.Number),
  );
  getLogger("denops-ollama-verbose").debug(`reserved context: ${context}`);
  getLogger("denops-ollama-verbose").debug(`prompt: ${prompt}`);

  if (prompt === "exit") {
    await helper.execute(denops, `bunload! ${bufnr}`);
    return;
  }

  // prepare writer to set response to buffer
  let continuation = false;
  const writer = new WritableStream<GenerateChatCompletionResponse>({
    write: async (item) => {
      const newLines = item.response.split(/\r?\n/);
      const info = await fn.getbufinfo(denops, bufnr);
      const lastLineAt = info[0].linecount - 1;
      if (continuation) {
        const lastLine = await fn.getline(denops, lastLineAt);
        await fn.setline(denops, lastLineAt, lastLine + newLines[0]);
      } else {
        getLogger("denops-ollama-verbose").debug(`content: "${newLines[0]}"`);
        getLogger("denops-ollama-verbose").debug(`lastLineAt: ${lastLineAt}`);
        await fn.append(denops, lastLineAt, newLines[0]);
        continuation = true;
      }
      if (newLines.length > 0) {
        await fn.append(denops, lastLineAt, newLines.slice(1));
      }
      if (item.context) {
        await fn.setbufvar(
          denops,
          bufnr,
          "ollama_generate_completion_context",
          item.context,
        );
      }
    },
  });

  try {
    // call generateCompletion
    const result = await generateChatCompletion({ model, prompt, context }, {
      init: { signal },
    });
    if (!result.body) {
      return;
    }
    await result.body.pipeTo(writer);
  } catch (err) {
    getLogger("denops-ollama").error(err);
  } finally {
    await fn.setbufvar(denops, bufnr, "&modified", 0);
  }
}
