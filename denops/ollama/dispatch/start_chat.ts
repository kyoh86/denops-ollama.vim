import { getLogger } from "https://deno.land/std@0.211.0/log/mod.ts";
import { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v5.2.0/function/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v5.2.0/batch/mod.ts";
import * as option from "https://deno.land/x/denops_std@v5.2.0/option/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v5.2.0/helper/mod.ts";
import * as lambda from "https://deno.land/x/denops_std@v5.2.0/lambda/mod.ts";
import * as datetime from "https://deno.land/std@0.211.0/datetime/mod.ts";
import {
  ensure,
  is,
  maybe,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";
import { abortableAsyncIterable } from "https://deno.land/std@0.203.0/async/mod.ts";

import { generateCompletion } from "../api.ts";
import { Opener } from "./types.ts";
import PromptBufferEcho from "../util/prompt_buffer_echo.ts";
import { canceller } from "../util/cancellable.ts";

export default async function start_chat(
  denops: Denops,
  model: string,
  opener?: Opener,
) {
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
    await fn.prompt_setprompt(denops, bufnr, `(${model})>> `);
    await denops.cmd(
      "call prompt_setcallback(bufnr, function('ollama#internal#notify_callback', [l:denops_name, l:lambda_id]))",
      {
        bufnr,
        denops_name: denops.name,
        lambda_id: lambda.register(
          denops,
          async (uPrompt) => {
            const prompt = ensure(uPrompt, is.String);
            await promptCallback(denops, bufnr, model, prompt);
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
  bufnr: number,
  model: string,
  prompt: string,
) {
  if (prompt === "exit") {
    await helper.execute(denops, `bdelete! ${bufnr}`);
    return;
  }
  getLogger("denops-ollama-verbose").debug(`prompt: ${prompt}`);

  const context = maybe(
    await fn.getbufvar(denops, bufnr, "ollama_chat_context"),
    is.ArrayOf(is.Number),
  );
  getLogger("denops-ollama-verbose").debug(`reserved context: ${context}`);

  const { signal, cancel } = await canceller(denops);
  try {
    const result = await generateCompletion({ model, prompt, context }, {
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

      // memory completion context
      if (item.context) {
        await fn.setbufvar(denops, bufnr, "ollama_chat_context", item.context);
      }

      // put response to buffer
      await p.put(denops, item.response);
    }
  } catch (err) {
    getLogger("denops-ollama").error(err);
  } finally {
    cancel();
    await fn.setbufvar(denops, bufnr, "&modified", 0);
  }
}
