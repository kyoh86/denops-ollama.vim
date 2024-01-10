import { type Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v5.2.0/function/mod.ts";

export type Printer = (denops: Denops, text: string) => Promise<void>;

export function bufEcho(bufnr: number): Printer {
  let first = true;
  return async (denops: Denops, text: string) => {
    try {
      const chunk = text.split(/\r?\n/);
      const info = await fn.getbufinfo(denops, bufnr);
      const lastLineAt = info[0].linecount - 1;
      if (first) {
        if (chunk[0] !== "") {
          await fn.appendbufline(denops, bufnr, lastLineAt, [chunk[0]]);
        }
        first = false;
      } else {
        const lastLine = await fn.getbufline(denops, bufnr, lastLineAt);
        await fn.setbufline(
          denops,
          bufnr,
          lastLineAt,
          lastLine + chunk[0],
        );
      }
      if (chunk.length > 0) {
        await fn.appendbufline(denops, bufnr, lastLineAt, chunk.slice(1));
      }
    } finally {
      await fn.setbufvar(denops, bufnr, "&modified", 0);
    }
  };
}
