import { test } from "https://deno.land/x/denops_test@v1.8.0/mod.ts";
import { bufnr } from "https://deno.land/x/denops_std@v6.5.0/function/mod.ts";
import * as target from "./spinner.ts";
import { default as sp, type SpinnerName } from "npm:cli-spinners@3.0.0";

test({
  mode: "all",
  name: "It works well exceeds one cycle",
  fn: async (denops) => {
    const kind: SpinnerName = "dots";
    const buf = await bufnr(denops);
    await target.init(denops, buf);
    const id = await target.start(denops, buf);
    const timeout = sp[kind].interval * (sp[kind].frames.length + 2);
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, timeout);
    });
    await target.stop(denops, buf, id);
  },
});
