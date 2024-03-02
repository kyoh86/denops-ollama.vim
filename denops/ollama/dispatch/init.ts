import { Denops } from "https://deno.land/x/denops_std@v6.2.0/mod.ts";
import {
  ConsoleHandler,
  setup as setupLog,
} from "https://deno.land/std@0.218.2/log/mod.ts";
import xdg from "https://deno.land/x/xdg@v10.6.0/src/mod.deno.ts";
import { ensureFile } from "https://deno.land/std@0.218.2/fs/ensure_file.ts";
import { join } from "https://deno.land/std@0.218.2/path/join.ts";

import { setup as setupHighlight } from "../ui/highlight_prefix.ts";
import { mapCancel } from "../util/cancellable.ts";

export async function init(denops: Denops) {
  const cacheFile = join(xdg.cache(), "denops-ollama-vim", "log.txt");
  await ensureFile(cacheFile);

  setupLog({
    handlers: {
      console: new ConsoleHandler("DEBUG"),
    },
    loggers: {
      "denops-ollama": {
        level: "INFO",
        handlers: ["console", "cache"],
      },
      "denops-ollama-verbose": {
        level: "DEBUG",
        handlers: [],
      },
    },
  });

  await mapCancel(denops);
  await setupHighlight(denops);
  return { cacheFile };
}
