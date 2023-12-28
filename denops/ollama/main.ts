import { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import { batch } from "https://deno.land/x/denops_std@v5.2.0/batch/mod.ts";
import xdg from "https://deno.land/x/xdg@v10.6.0/src/mod.deno.ts";
import { join } from "https://deno.land/std@0.210.0/path/mod.ts";
import { ensureFile } from "https://deno.land/std@0.210.0/fs/mod.ts";
import { ensure, is } from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v5.2.0/function/mod.ts";
import * as v from "https://deno.land/x/denops_std@v5.2.0/variable/mod.ts";
import {
  getLogger,
  handlers,
  setup,
} from "https://deno.land/std@0.210.0/log/mod.ts";
import { generateCompletion } from "./api.ts";

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

  denops.dispatcher = {
    async generate_completion(
      uModel: unknown,
      uPrompt: unknown,
      uContext: unknown,
    ) {
      try {
        const model = ensure(uModel, is.String);
        const prompt = ensure(uPrompt, is.String);
        const context = ensure(uContext, is.Record);
        console.debug(`reserved context: ${context}`);
        const result = await generateCompletion({
          model,
          prompt,
        });
        const bufnr = await fn.bufadd(denops, "ollama://outputs");
        await fn.bufload(denops, bufnr);
        await fn.appendbufline(
          denops,
          bufnr,
          "$",
          result.body.map((entry) => entry.response).join(""),
        );
      } catch (err) {
        getLogger("denops-ollama").error(err);
      }
    },
  };
}
