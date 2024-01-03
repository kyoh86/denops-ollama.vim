import { getLogger } from "https://deno.land/std@0.210.0/log/mod.ts";
import { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v5.2.0/function/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v5.2.0/batch/mod.ts";
import * as option from "https://deno.land/x/denops_std@v5.2.0/option/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v5.2.0/helper/mod.ts";
import * as lambda from "https://deno.land/x/denops_std@v5.2.0/lambda/mod.ts";
import {
  ensure,
  is,
  maybe,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";

import { generateCompletion } from "../api.ts";

const abort = new AbortController();

export default async function start_chat(
  denops: Denops,
  model: string,
  opener?: "split" | "vsplit" | "tabnew" | "edit" | "new" | "vnew",
) {
  const bufname = "ollama://generate_completion";
  const bufnr = await fn.bufadd(denops, bufname);

  await batch.batch(denops, async () => {
    await option.filetype.setBuffer(
      denops,
      bufnr,
      "ollama.generate_completion",
    );
    await option.buftype.setBuffer(denops, bufnr, "prompt");
    await option.buflisted.setBuffer(denops, bufnr, true);
    await option.swapfile.setBuffer(denops, bufnr, false);
    await fn.bufload(denops, bufnr);
    await fn.setbufline(denops, bufnr, 1, [
      "Enter the name of the completion to generate: ",
    ]);
    await fn.prompt_setprompt(denops, bufnr, ">> ");
    await denops.cmd(
      "call prompt_setcallback(bufnr, function('ollama#internal#callback_helper', [denops_name, lambda_id]))",
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
    await denops.cmd(
      "call prompt_setinterrupt(bufnr, function('ollama#internal#callback_helper', [denops_name, lambda_id]))",
      {
        bufnr,
        denops_name: denops.name,
        lambda_id: lambda.register(
          denops,
          () => {
            abort.abort();
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
  const writer = new WritableStream({
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
  abort.signal.addEventListener("abort", writer.abort.bind(writer));

  try {
    // call generateCompletion
    const result = await generateCompletion({ model, prompt, context });
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