import { test } from "https://deno.land/x/denops_test@v1.6.2/mod.ts";
import { bufnr } from "https://deno.land/x/denops_std@v6.1.0/function/mod.ts";
import * as target from "./spinner.ts";
import sp from "npm:cli-spinners@2.9.2";

test({
  mode: "all",
  name: "It works well exceeds one cycle",
  fn: async (denops) => {
    const kind: sp.SpinnerName = "dots";
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
