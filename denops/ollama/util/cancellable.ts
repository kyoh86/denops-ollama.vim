import { map } from "https://deno.land/x/denops_std@v5.2.0/mapping/mod.ts";
import * as lambda from "https://deno.land/x/denops_std@v5.2.0/lambda/mod.ts";
import { generateUniqueString } from "https://deno.land/x/denops_std@v5.2.0/util.ts";
import * as autocmd from "https://deno.land/x/denops_std@v5.2.0/autocmd/mod.ts";
import { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";

export function mapCancel(denops: Denops) {
  // See ../../../autoload/ollama/internal.vim
  map(denops, "<C-c>", `ollama#internal#cancel_helper()`, {
    expr: true,
    mode: ["n"],
  });
}

export function canceller(denops: Denops) {
  const abort = new AbortController();
  const group = generateUniqueString();
  const callback = lambda.register(denops, () => {
    abort.abort();
  });
  autocmd.group(denops, group, (helper) => {
    helper.define(
      "User",
      "OllamaCancel",
      `call ollama#internal#callback_helper("${denops.name}", "${callback}")`,
      { once: true },
    );
  });
  return {
    signal: abort.signal,
    cancel: () => {
      autocmd.remove(denops, "User", "OllamaCancel", { group });
      abort.abort();
    },
  };
}
