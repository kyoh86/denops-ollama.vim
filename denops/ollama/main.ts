import { join } from "https://deno.land/std@0.211.0/path/mod.ts";
import { ensureFile } from "https://deno.land/std@0.211.0/fs/mod.ts";
import {
  handlers as logHandlers,
  setup as setupLog,
} from "https://deno.land/std@0.211.0/log/mod.ts";
import { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import {
  ensure,
  is,
  maybe,
} from "https://deno.land/x/unknownutil@v3.13.0/mod.ts";
import xdg from "https://deno.land/x/xdg@v10.6.0/src/mod.deno.ts";

import init from "./dispatch/init.ts";
import startChat, {
  isGenerateCompletionParam,
  isOpener,
} from "./dispatch/start_chat.ts";
import listModels from "./dispatch/list_models.ts";
import pullModel from "./dispatch/pull_model.ts";
import deleteModel from "./dispatch/delete_model.ts";
import {
  isChatContext,
  startChatWithContext,
} from "./dispatch/start_chat_with_context.ts";

export async function main(denops: Denops) {
  const cacheFile = join(xdg.cache(), "denops-ollama-vim", "log.txt");
  await ensureFile(cacheFile);

  setupLog({
    handlers: {
      console: new logHandlers.ConsoleHandler("DEBUG"),
      cache: new logHandlers.RotatingFileHandler("DEBUG", {
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

  await init(denops);

  denops.dispatcher = {
    async openLog() {
      await denops.cmd(`edit ${cacheFile}`);
    },

    async startChat(
      uModel: unknown,
      uOpener: unknown,
      uParams: unknown,
    ) {
      await startChat(
        denops,
        ensure(uModel, is.String),
        maybe(uOpener, isOpener),
        maybe(uParams, isGenerateCompletionParam),
      );
    },

    async startChatWithContext(
      uModel: unknown,
      uContext: unknown,
      uOpener: unknown,
      uParams: unknown,
    ) {
      await startChatWithContext(
        denops,
        ensure(uModel, is.String),
        ensure(uContext, isChatContext),
        maybe(uOpener, isOpener),
        maybe(uParams, isGenerateChatCompletionParam),
      );
    },

    async listModels() {
      await listModels(
        denops,
      );
    },

    async pullModel(uName: unknown, uInsecure: unknown) {
      await pullModel(
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

    async deleteModel(uName: unknown) {
      await deleteModel(
        denops,
        ensure(
          uName,
          is.String,
        ),
      );
    },
  };
}
