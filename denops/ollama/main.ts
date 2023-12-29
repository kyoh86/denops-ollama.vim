import { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import xdg from "https://deno.land/x/xdg@v10.6.0/src/mod.deno.ts";
import { join } from "https://deno.land/std@0.210.0/path/mod.ts";
import { ensureFile } from "https://deno.land/std@0.210.0/fs/mod.ts";
import { is, maybe } from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";
import { start } from "./dispatch/generate_completion.ts";
import { handlers, setup } from "https://deno.land/std@0.210.0/log/mod.ts";

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
      uOpener: unknown,
      uModel: unknown,
    ) {
      await start(
        denops,
        maybe(
          uOpener,
          is.OneOf([
            is.LiteralOf("split"),
            is.LiteralOf("vsplit"),
            is.LiteralOf("tabnew"),
            is.LiteralOf("edit"),
            is.LiteralOf("new"),
            is.LiteralOf("vnew"),
          ]),
        ),
        maybe(
          uModel,
          is.String,
        ) || "codellama",
      );
    },
  };
}
