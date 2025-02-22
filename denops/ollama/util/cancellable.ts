import { map } from "jsr:@denops/std@~7.5.0/mapping";
import * as lambda from "jsr:@denops/std@~7.5.0/lambda";
import { ulid } from "jsr:@std/ulid@~1.0.0";
import * as autocmd from "jsr:@denops/std@~7.5.0/autocmd";
import type { Denops } from "jsr:@denops/std@~7.5.0";

export async function mapCancel(denops: Denops) {
  // See ../../../autoload/ollama/internal.vim
  await map(denops, "<C-c>", `ollama#internal#cancel()`, {
    expr: true,
    mode: ["n"],
  });
}

export async function canceller(denops: Denops, timeout?: number) {
  const abort = new AbortController();
  if (timeout) {
    setTimeout(() => abort.abort(), timeout);
  }
  const group = ulid();
  await autocmd.group(denops, group, (helper) => {
    helper.define(
      "User",
      "OllamaCancel",
      `call ollama#internal#notify_callback("${denops.name}", "${
        lambda.register(denops, () => {
          abort.abort("cancelled");
        })
      }")`,
      { once: true },
    );
  });
  return {
    signal: abort.signal,
    cancel: async () => {
      await autocmd.remove(denops, "User", "OllamaCancel", { group });
      abort.abort();
    },
  };
}
