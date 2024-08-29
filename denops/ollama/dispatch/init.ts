import type { Denops } from "jsr:@denops/std@~7.1.0";
import { ConsoleHandler, setup as setupLog } from "jsr:@std/log@~0.224.5";
import xdg from "https://deno.land/x/xdg@v10.6.0/src/mod.deno.ts";
import { ensureFile } from "jsr:@std/fs@~1.0.0";
import { join } from "jsr:@std/path@~1.0.2/join";

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
