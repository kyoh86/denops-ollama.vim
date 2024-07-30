import { test } from "jsr:@denops/test@3.0.1";
import { bufnr } from "jsr:@denops/std@7.0.0/function";
import * as target from "./spinner.ts";
import { default as sp, type SpinnerName } from "npm:cli-spinners@3.1.0";

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
