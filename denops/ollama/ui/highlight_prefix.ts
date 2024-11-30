import type { Denops } from "jsr:@denops/std@~7.4.0";

export async function setup(denops: Denops) {
  await denops.cmd("highlight default link OllamaPrompt Question");
}

export type HighlightPrefix = (
  denops: Denops,
  lnum: number,
) => Promise<void>;

export async function prepareHighlightPrefix(
  denops: Denops,
  bufnr: number,
  size: number,
): Promise<HighlightPrefix> {
  if (denops.meta.host === "nvim") {
    return highlightPrefixForNeovim(bufnr, size);
  }
  if (denops.meta.host == "vim") {
    return await highlightPrefixForVim(denops, bufnr, size);
  }
  throw new Error(`Unsupported host: ${denops.meta.host}`);
}

async function highlightPrefixForVim(
  denops: Denops,
  bufnr: number,
  size: number,
) {
  await denops.call("prop_type_add", "ollama-prompt", {
    bufnr,
    highlight: "OllamaPrompt",
  });

  return async (denops: Denops, lnum: number) => {
    await denops.call("prop_add", "ollama-prompt", {
      bufnr,
      highlight: "OllamaPrompt",
      col: 1,
      lnum: lnum,
      length: size,
    });
  };
}

function highlightPrefixForNeovim(bufnr: number, size: number) {
  return async (denops: Denops, lnum: number) => {
    await denops.call(
      "nvim_buf_add_highlight",
      bufnr,
      -1,
      "OllamaPrompt",
      lnum - 1,
      0,
      size,
    );
  };
}
