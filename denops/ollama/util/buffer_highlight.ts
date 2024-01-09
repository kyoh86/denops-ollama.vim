import { type Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";

export async function setup(denops: Denops) {
  await denops.cmd("highlight default link OllamaPrompt Question");
}

export interface BufferHighlight {
  markPrefix(
    denops: Denops,
    lnum: number,
    bytes: number,
  ): Promise<void>;
}

export async function createBufferHighlight(
  denops: Denops,
  bufnr: number,
): Promise<BufferHighlight> {
  if (denops.meta.host === "nvim") {
    return new BufferHighlightForNeovim(bufnr);
  }
  if (denops.meta.host == "vim") {
    const i = new BufferHighlightForVim(bufnr);
    await i.prepare(denops);
    return i;
  }
  throw new Error(`Unsupported host: ${denops.meta.host}`);
}

// UNDONE: split implment into vim and nvim
class BufferHighlightForVim implements BufferHighlight {
  #bufnr: number;
  constructor(bufnr: number) {
    this.#bufnr = bufnr;
  }

  async prepare(denops: Denops) {
    await denops.call("prop_type_add", "ollama-prompt", {
      bufnr: this.#bufnr,
      highlight: "OllamaPrompt",
    });
  }

  async markPrefix(denops: Denops, lnum: number, bytes: number) {
    await denops.call("prop_add", "ollama-prompt", {
      bufnr: this.#bufnr,
      highlight: "OllamaPrompt",
      col: 1,
      lnum: lnum,
      length: bytes,
    });
  }
}
class BufferHighlightForNeovim implements BufferHighlight {
  #bufnr: number;
  constructor(bufnr: number) {
    this.#bufnr = bufnr;
  }

  async markPrefix(denops: Denops, lnum: number, bytes: number) {
    await denops.call(
      "nvim_buf_add_highlight",
      this.#bufnr,
      -1,
      "OllamaPrompt",
      lnum - 1,
      0,
      bytes,
    );
  }
}
