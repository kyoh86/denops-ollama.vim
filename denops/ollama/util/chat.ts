import { getLogger } from "https://deno.land/std@0.211.0/log/mod.ts";
import * as datetime from "https://deno.land/std@0.211.0/datetime/mod.ts";
import { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import { generateUniqueString } from "https://deno.land/x/denops_std@v5.2.0/util.ts";
import * as autocmd from "https://deno.land/x/denops_std@v5.2.0/autocmd/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v5.2.0/function/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v5.2.0/batch/mod.ts";
import * as option from "https://deno.land/x/denops_std@v5.2.0/option/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v5.2.0/helper/mod.ts";
import * as lambda from "https://deno.land/x/denops_std@v5.2.0/lambda/mod.ts";
import {
  ensure,
  is,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.13.0/mod.ts";
import { Queue } from "https://deno.land/x/async@v2.1.0/queue.ts";

import {
  type HighlightPrefix,
  prepareHighlightPrefix,
} from "../util/highlight_prefix.ts";
import { canceller } from "../util/cancellable.ts";

export const isOpener = is.OneOf([
  is.LiteralOf("split"),
  is.LiteralOf("vsplit"),
  is.LiteralOf("tabnew"),
  is.LiteralOf("edit"),
  is.LiteralOf("new"),
  is.LiteralOf("vnew"),
]);

export type Opener = PredicateType<typeof isOpener>;

export abstract class ChatBase<TContext> {
  abstract parseContext(context: unknown): TContext | undefined;
  abstract process(
    denops: Denops,
    bufnr: number,
    context: TContext | undefined,
    signal: AbortSignal,
    prompt: string,
  ): Promise<void>;

  constructor(protected readonly model: string, private context?: TContext) {}

  protected async setContext(denops: Denops, bufnr: number, context: TContext) {
    if (context === undefined) return;
    this.context = context;
    await fn.setbufvar(denops, bufnr, "ollama_chat_context", context);
  }

  async #setupBuf(denops: Denops, bufnr: number) {
    const group = generateUniqueString();
    const abort = new AbortController();
    await autocmd.group(denops, group, (helper) => {
      helper.define(
        "BufEnter",
        `<buffer=${bufnr}>`,
        `call ollama#internal#notify_callback("${denops.name}", "${
          lambda.register(denops, async () => {
            await this.processAll(denops, abort.signal, bufnr);
          })
        }")`,
        { once: true },
      );
      helper.define(
        "BufUnload",
        `<buffer=${bufnr}>`,
        `call ollama#internal#notify_callback("${denops.name}", "${
          lambda.register(denops, () => {
            abort.abort();
            this.#queue.push("exit");
          })
        }")`,
        { once: true },
      );
    });
    await option.filetype.setBuffer(denops, bufnr, "ollama.chat");
    await option.buftype.setBuffer(denops, bufnr, "prompt");
    await option.buflisted.setBuffer(denops, bufnr, true);
    await option.swapfile.setBuffer(denops, bufnr, false);
    await fn.bufload(denops, bufnr);
    await fn.prompt_setprompt(denops, bufnr, `(${this.model})>> `);
    return bufnr;
  }

  async #editBuf(denops: Denops, bufname: string, opener?: Opener) {
    await helper.execute(denops, `${opener ?? "tabnew"} ${bufname}`);
    await helper.execute(denops, "setlocal wrap");
    await helper.execute(denops, "startinsert");
  }

  #firstLine = true;
  #queue = new Queue<string>();

  async start(denops: Denops, opener?: Opener) {
    const now = datetime.format(new Date(), "yyyy-MM-ddTHH-mm-ss.SSS");
    const bufname = `ollama://chat/${now}`;

    await batch.batch(denops, async () => {
      const bufnr = await fn.bufadd(denops, bufname);
      if (this.context !== undefined) {
        await this.setContext(denops, bufnr, this.context);
      }
      await this.#setupBuf(denops, bufnr);

      const highlight = await prepareHighlightPrefix(
        denops,
        bufnr,
        await fn.strlen(denops, `(${this.model})>> `),
      );
      this.#firstLine = true;
      await fn.prompt_setinterrupt(denops, bufnr, "ollama#internal#cancel");
      await denops.cmd(
        "call prompt_setcallback(bufnr, function('ollama#internal#notify_callback', [l:denops_name, l:lambda_id]))",
        {
          bufnr: bufnr,
          denops_name: denops.name,
          lambda_id: lambda.register(denops, async (uPrompt) => {
            const prompt = ensure(uPrompt, is.String);
            await this.#promptCallback(denops, bufnr, highlight, prompt);
          }),
        },
      );
      await this.#editBuf(denops, bufname, opener);
      await highlight(denops, 1);
    });
  }

  protected async echo(denops: Denops, bufnr: number, text: string) {
    try {
      const chunk = text.split(/\r?\n/);
      const info = await fn.getbufinfo(denops, bufnr);
      const lastLineAt = info[0].linecount - 1;
      if (this.#firstLine) {
        if (chunk[0] !== "") {
          await fn.appendbufline(denops, bufnr, lastLineAt, [chunk[0]]);
        }
        this.#firstLine = false;
      } else {
        const lastLine = await fn.getbufline(denops, bufnr, lastLineAt);
        await fn.setbufline(denops, bufnr, lastLineAt, lastLine + chunk[0]);
      }
      if (chunk.length > 0) {
        await fn.appendbufline(denops, bufnr, lastLineAt, chunk.slice(1));
      }
    } finally {
      await fn.setbufvar(denops, bufnr, "&modified", 0);
    }
  }

  async processAll(denops: Denops, signal: AbortSignal, bufnr: number) {
    while (!signal.aborted) {
      const prompt = await this.#queue.pop();
      if (prompt === "exit") {
        await helper.execute(denops, `silent! bdelete! ${bufnr}`);
        return;
      }

      const context = this.parseContext(
        await fn.getbufvar(denops, bufnr, "ollama_chat_context"),
      );
      getLogger("denops-ollama-verbose").debug(`reserved context: ${context}`);

      const { signal: reqSignal, cancel } = await canceller(denops);
      try {
        await this.process(denops, bufnr, context, reqSignal, prompt);
      } catch (err) {
        getLogger("denops-ollama").error(err);
      } finally {
        cancel();
        await fn.setbufvar(denops, bufnr, "&modified", 0);
      }
    }
    denops.cmd("echomsg 'finished'");
  }

  async #promptCallback(
    denops: Denops,
    bufnr: number,
    highlight: HighlightPrefix,
    prompt: string,
  ) {
    getLogger("denops-ollama-verbose").debug(`prompt: ${prompt}`);

    const info = await fn.getbufinfo(denops, bufnr);
    highlight!(denops, info[0].linecount);
    this.#queue.push(prompt);
  }
}
