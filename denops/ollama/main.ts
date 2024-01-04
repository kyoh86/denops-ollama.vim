import { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import * as mapping from "https://deno.land/x/denops_std@v5.2.0/mapping/mod.ts";
import xdg from "https://deno.land/x/xdg@v10.6.0/src/mod.deno.ts";
import { join } from "https://deno.land/std@0.210.0/path/mod.ts";
import { ensureFile } from "https://deno.land/std@0.210.0/fs/mod.ts";
import {
  ensure,
  is,
  maybe,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";
import { handlers, setup } from "https://deno.land/std@0.210.0/log/mod.ts";

import start_chat from "./dispatch/start_chat.ts";
import list_models from "./dispatch/list_models.ts";
import pull_model from "./dispatch/pull_model.ts";
import delete_model from "./dispatch/delete_model.ts";
import {
  isChatContext,
  start_chat_with_context,
} from "./dispatch/start_chat_with_context.ts";
import { isOpener } from "./dispatch/types.ts";

const abort = new AbortController();

export async function main(denops: Denops) {
  const cacheFile = join(xdg.cache(), "denops-ollama-vim", "log.txt");
  await ensureFile(cacheFile);

  setup({
    handlers: {
      console: new handlers.ConsoleHandler("DEBUG"),
      cache: new handlers.RotatingFileHandler("DEBUG", {
        filename: cacheFile,
        maxBytes: 1024 * 1024,
        maxBackupCount: 1,
      }),
    },
    loggers: {
      "denops-ollama": {
        level: "INFO",
        handlers: ["console", "cache"],
      },
      "denops-ollama-verbose": {
        level: "DEBUG",
        handlers: ["cache"],
      },
    },
  });

  mapping.map(
    denops,
    "<C-c>",
    `ollama#internal#cancel_helper("${denops.name}")`,
    {
      expr: true,
      mode: ["n"],
    },
  );

  denops.dispatcher = {
    cancel() {
      abort.abort();
    },

    async start_chat(
      uModel: unknown,
      uOpener: unknown,
    ) {
      await start_chat(
        denops,
        abort.signal,
        ensure(uModel, is.String),
        maybe(uOpener, isOpener),
      );
    },

    async start_chat_with_context(
      uModel: unknown,
      uOpener: unknown,
      uContext: unknown,
    ) {
      await start_chat_with_context(
        denops,
        abort.signal,
        ensure(uModel, is.String),
        maybe(uOpener, isOpener),
        maybe(uContext, isChatContext),
      );
    },

    async list_models() {
      return await list_models(
        denops,
        abort.signal,
      );
    },

    async pull_model(uName: unknown, uInsecure: unknown) {
      await pull_model(
        denops,
        abort.signal,
        ensure(
          uName,
          is.String,
        ),
        maybe(
          uInsecure,
          is.Boolean,
        ),
      );
    },

    async delete_model(uName: unknown) {
      await delete_model(
        denops,
        abort.signal,
        ensure(
          uName,
          is.String,
        ),
      );
    },
  };
}
