import { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import xdg from "https://deno.land/x/xdg@v10.6.0/src/mod.deno.ts";
import { join } from "https://deno.land/std@0.210.0/path/mod.ts";
import { ensureFile } from "https://deno.land/std@0.210.0/fs/mod.ts";
import {
  ensure,
  is,
  maybe,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v5.2.0/function/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v5.2.0/buffer/mod.ts";
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
      uBufNr: unknown,
      uModel: unknown,
      uPrompt: unknown,
    ) {
      const bufnr = ensure(uBufNr, is.Number);
      const model = ensure(uModel, is.String);
      const prompt = ensure(uPrompt, is.String);
      try {
        const context = maybe(
          await fn.getbufvar(
            denops,
            bufnr,
            "ollama_generate_completion_context",
          ),
          is.ArrayOf(is.Number),
        );
        console.debug(`reserved context: ${context}`);
        const result = await generateCompletion({ model, prompt, context });
        if (!result.body) {
          return;
        }
        for await (const item of result.body) {
          const newLines = item.response.split(/\r?\n/);
          await buffer.ensure(denops, bufnr, async () => {
            const line = await fn.line(denops, "$");
            const lastLine = await fn.getline(denops, line - 1);
            await fn.setline(
              denops,
              line - 1,
              lastLine + newLines[0],
            );
            if (newLines.length > 0) {
              await fn.append(
                denops,
                line - 1,
                newLines.slice(1),
              );
            }
          });
          if (item.context) {
            await fn.setbufvar(
              denops,
              bufnr,
              "ollama_generate_completion_context",
              item.context,
            );
          }
        }
      } catch (err) {
        getLogger("denops-ollama").error(err);
      } finally {
        await fn.setbufvar(denops, bufnr, "&modified", 0);
      }
    },
  };
}
