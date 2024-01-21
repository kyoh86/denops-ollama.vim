import { Denops } from "https://deno.land/x/denops_std@v5.3.0/mod.ts";
import {
  handlers as logHandlers,
  setup as setupLog,
} from "https://deno.land/std@0.212.0/log/mod.ts";
import xdg from "https://deno.land/x/xdg@v10.6.0/src/mod.deno.ts";
import { ensureFile } from "https://deno.land/std@0.212.0/fs/ensure_file.ts";
import { join } from "https://deno.land/std@0.212.0/path/join.ts";

import { setup as setupHighlight } from "../ui/highlight_prefix.ts";
import { mapCancel } from "../util/cancellable.ts";

export default async function init(denops: Denops) {
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

  await mapCancel(denops);
  await setupHighlight(denops);
  return { cacheFile };
}
