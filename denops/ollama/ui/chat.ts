import { getLogger } from "jsr:@std/log@~0.224.5";
import * as datetime from "jsr:@std/datetime@~0.224.3";
import type { Denops } from "jsr:@denops/std@~7.0.1";
import { ulid } from "jsr:@std/ulid@~1.0.0";
import * as autocmd from "jsr:@denops/std@~7.0.1/autocmd";
import * as fn from "jsr:@denops/std@~7.0.1/function";
import * as batch from "jsr:@denops/std@~7.0.1/batch";
import * as option from "jsr:@denops/std@~7.0.1/option";
import * as helper from "jsr:@denops/std@~7.0.1/helper";
import * as lambda from "jsr:@denops/std@~7.0.1/lambda";
import { ensure, is } from "jsr:@core/unknownutil@~4.0.0";
import { Notify, Queue } from "jsr:@lambdalisue/async@~2.1.1";

import {
  type HighlightPrefix,
  prepareHighlightPrefix,
} from "./highlight_prefix.ts";
import { canceller } from "../util/cancellable.ts";
import * as spinner from "./spinner.ts";
import type { Opener } from "./open.ts";

export abstract class ChatBase<TContext> {
  abstract parseContext(context: unknown): TContext | undefined;
  abstract process(
    denops: Denops,
    bufnr: number,
    context: TContext | undefined,
    signal: AbortSignal,
    prompt: string,
  ): Promise<void>;

  constructor(
    protected readonly model: string,
    private timeout?: number,
    private context?: TContext,
    private message?: string,
  ) {}

  protected async setContext(denops: Denops, bufnr: number, context: TContext) {
    if (context === undefined) return;
    this.context = context;
    await fn.setbufvar(denops, bufnr, "ollama_chat_context", context);
  }

  #promptString() {
    return `(${this.model})>> `;
  }

  async #setupBuf(denops: Denops, bufnr: number) {
    const group = ulid();
    await autocmd.group(denops, group, (helper) => {
      helper.define(
        "BufEnter",
        `<buffer=${bufnr}>`,
        `call ollama#internal#notify_callback("${denops.name}", "${
          lambda.register(denops, async () => {
            await this.processAll(denops, bufnr);
          })
        }")`,
        { once: true },
      );
      helper.define(
        "BufUnload",
        `<buffer=${bufnr}>`,
        `call ollama#internal#notify_callback("${denops.name}", "${
          lambda.register(denops, () => {
            this.#finish.notify();
          })
        }")`,
        { once: true },
      );
    });
    await spinner.init(denops, bufnr); // TODO: configure kind and highlight
    await option.filetype.setBuffer(denops, bufnr, "ollama.chat");
    await option.buftype.setBuffer(denops, bufnr, "prompt");
    await option.buflisted.setBuffer(denops, bufnr, true);
    await option.swapfile.setBuffer(denops, bufnr, false);
    await fn.bufload(denops, bufnr);
    await fn.prompt_setprompt(denops, bufnr, this.#promptString());
    return bufnr;
  }

  async #editBuf(denops: Denops, bufname: string, opener?: Opener) {
    await helper.execute(denops, `${opener ?? "tabnew"} ${bufname}`);
    await helper.execute(denops, "setlocal wrap");
    await helper.execute(denops, "startinsert");
  }

  #firstLine = true;
  #queue = new Queue<string>();
  #finish = new Notify();

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
        await fn.strlen(denops, this.#promptString()),
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
      if (this.message) {
        await fn.appendbufline(denops, bufnr, 0, [
          this.#promptString() + this.message,
        ]);
        highlight!(denops, 1);
        this.#queue.push(this.message);
      }
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

  async processAll(denops: Denops, bufnr: number) {
    while (true) {
      const prompt = await Promise.race([
        this.#queue.pop(),
        (async () => {
          await this.#finish.notified();
          return "exit";
        })(),
      ]);
      if (prompt === "exit") {
        await helper.execute(denops, `silent! bdelete! ${bufnr}`);
        break;
      }
      const context = this.parseContext(
        await fn.getbufvar(denops, bufnr, "ollama_chat_context"),
      );
      getLogger("denops-ollama-verbose").debug(`reserved context: ${context}`);

      const { signal, cancel } = await canceller(denops, this.timeout);
      const timer = await spinner.start(denops, bufnr);
      try {
        await this.process(denops, bufnr, context, signal, prompt);
      } catch (err) {
        getLogger("denops-ollama").error(err);
      } finally {
        await spinner.stop(denops, bufnr, timer);
        await cancel();
        await fn.setbufvar(denops, bufnr, "&modified", 0);
      }
    }
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
