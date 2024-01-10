import { type Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";

export async function setup(denops: Denops) {
  await denops.cmd("highlight default link OllamaPrompt Question");
}

export type HighlightPrefix = (
  denops: Denops,
  lnum: number,
  bytes: number,
) => Promise<void>;

export async function prepareHighlightPrefix(
  denops: Denops,
  bufnr: number,
): Promise<HighlightPrefix> {
  if (denops.meta.host === "nvim") {
    return highlightPrefixForNeovim(bufnr);
  }
  if (denops.meta.host == "vim") {
    return await highlightPrefixForVim(denops, bufnr);
  }
  throw new Error(`Unsupported host: ${denops.meta.host}`);
}

async function highlightPrefixForVim(denops: Denops, bufnr: number) {
  await denops.call("prop_type_add", "ollama-prompt", {
    bufnr,
    highlight: "OllamaPrompt",
  });

  return async (denops: Denops, lnum: number, bytes: number) => {
    await denops.call("prop_add", "ollama-prompt", {
      bufnr,
      highlight: "OllamaPrompt",
      col: 1,
      lnum: lnum,
      length: bytes,
    });
  };
}

function highlightPrefixForNeovim(bufnr: number) {
  return async (denops: Denops, lnum: number, bytes: number) => {
    await denops.call(
      "nvim_buf_add_highlight",
      bufnr,
      -1,
      "OllamaPrompt",
      lnum - 1,
      0,
      bytes,
    );
  };
}
