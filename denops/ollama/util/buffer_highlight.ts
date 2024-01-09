import { type Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v5.2.0/function/mod.ts";

// UNDONE: split implment into vim and nvim
export default class BufferHighlight {
  #bufnr: number;
  constructor(bufnr: number) {
    this.#bufnr = bufnr;
  }

  async setup(denops: Denops) {
    await denops.cmd("highlight default link OllamaPrompt Question");
  }

  async prepare(denops: Denops) {
    if (denops.meta.host === "vim") {
      await denops.call("prop_type_add", "ollama-prompt", {
        bufnr: this.#bufnr,
        highlight: "OllamaPrompt",
      });
    }
    if (denops.meta.host === "nvim") {
      // noop
    }
  }

  async markPrefix(denops: Denops, lnum: number, prefix: string) {
    if (denops.meta.host === "vim") {
      await denops.call("prop_add", "ollama-prompt", {
        bufnr: this.#bufnr,
        highlight: "OllamaPrompt",
        col: 1,
        lnum: lnum,
        length: await fn.strlen(denops, prefix),
      });
    }
    if (denops.meta.host === "nvim") {
      await denops.call(
        "nvim_buf_add_highlight",
        this.#bufnr,
        -1,
        "OllamaPrompt",
        lnum - 1,
        0,
        await fn.strlen(denops, prefix),
      );
    }
  }
}
