import { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import xdg from "https://deno.land/x/xdg@v10.6.0/src/mod.deno.ts";
import { join } from "https://deno.land/std@0.211.0/path/mod.ts";
import { ensureFile } from "https://deno.land/std@0.211.0/fs/mod.ts";
import {
  ensure,
  is,
  maybe,
} from "https://deno.land/x/unknownutil@v3.13.0/mod.ts";
import { handlers, setup } from "https://deno.land/std@0.211.0/log/mod.ts";

import start_chat from "./dispatch/start_chat.ts";
import list_models from "./dispatch/list_models.ts";
import pull_model from "./dispatch/pull_model.ts";
import delete_model from "./dispatch/delete_model.ts";
import {
  isChatContext,
  start_chat_with_context,
} from "./dispatch/start_chat_with_context.ts";
import { isOpener } from "./dispatch/types.ts";
import { mapCancel } from "./util/cancellable.ts";

export async function main(denops: Denops) {
  const cacheFile = join(xdg.cache(), "denops-ollama-vim", "log.txt");
  await ensureFile(cacheFile);

  setup({
    handlers: {
      console: new handlers.ConsoleHandler("DEBUG"),
      cache: new handlers.RotatingFileHandler("DEBUG", {
        filename: cacheFile,
        formatter: (record) => {
          return `${record.datetime.toISOString()} ${record.levelName} ${record.msg}`;
        },
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

  mapCancel(denops);

  denops.dispatcher = {
    async open_log() {
      await denops.cmd(`edit ${cacheFile}`);
    },

    async start_chat(
      uModel: unknown,
      uOpener: unknown,
    ) {
      await start_chat(
        denops,
        ensure(uModel, is.String),
        maybe(uOpener, isOpener),
      );
    },

    async start_chat_with_context(
      uModel: unknown,
      uContext: unknown,
      uOpener: unknown,
    ) {
      await start_chat_with_context(
        denops,
        ensure(uModel, is.String),
        ensure(uContext, isChatContext),
        maybe(uOpener, isOpener),
      );
    },

    async list_models() {
      await list_models(
        denops,
      );
    },

    async pull_model(uName: unknown, uInsecure: unknown) {
      await pull_model(
        denops,
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
        ensure(
          uName,
          is.String,
        ),
      );
    },
  };
}
