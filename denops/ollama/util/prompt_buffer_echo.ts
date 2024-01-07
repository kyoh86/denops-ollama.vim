import { type Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v5.2.0/function/mod.ts";

export default class PromptBufferEcho {
  constructor(private bufnr: number) {}

  async put(denops: Denops, text: string) {
    const chunk = text.split(/\r?\n/);
    const info = await fn.getbufinfo(denops, this.bufnr);
    const lastLineAt = info[0].linecount - 1;
    const lastLine = await fn.getbufline(denops, this.bufnr, lastLineAt);
    await fn.setbufline(denops, this.bufnr, lastLineAt, lastLine + chunk[0]);
    if (chunk.length > 0) {
      await fn.appendbufline(denops, this.bufnr, lastLineAt, chunk.slice(1));
    }
  }
}
