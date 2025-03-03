import spinners from "npm:cli-spinners@~3.2.0";
import type { SpinnerName as Kind } from "npm:cli-spinners@~3.2.0";
import type { Denops } from "jsr:@denops/std@~7.5.0";
import * as batch from "jsr:@denops/std@~7.5.0/batch";
import * as fn from "jsr:@denops/std@~7.5.0/function";
import { ensure, is } from "jsr:@core/unknownutil@~4.3.0";

const varPrefix = "ollama_ui_spinner";
const signGroup = "ollama_ui_spinner_group";

export interface Spinner {
  start(denops: Denops, buf: number): number;
  stop(denops: Denops, buf: number, id: number): Promise<void>;
}

export async function init(denops: Denops, buf: number, kind: Kind = "dots12") {
  await denops.cmd("highlight default link ollamaSpinner SignColumn");
  const sp = spinners[kind];
  await batch.batch(denops, async () => {
    await Promise.all(sp.frames.map(async (text, frame) => {
      await denops.call("sign_define", `${varPrefix}_${kind}_${frame}`, {
        text,
        texthl: "ollamaSpinner",
      });
    }));
    const placeholder = `${varPrefix}_${kind}_hold`;
    const width = await fn.strdisplaywidth(denops, sp.frames[0]);
    await denops.call("sign_define", placeholder, { text: " ".repeat(width) });
    await denops.call("sign_place", 0, "", placeholder, buf, { lnum: 1 });

    await fn.setbufvar(denops, buf, `${varPrefix}_kind`, kind);
    await fn.setbufvar(denops, buf, `${varPrefix}_frames`, sp.frames.length);
    await fn.setbufvar(denops, buf, `${varPrefix}_interval`, sp.interval);
  });
}

export async function start(
  denops: Denops,
  buf: number,
) {
  const kind = ensure(
    await fn.getbufvar(denops, buf, `${varPrefix}_kind`),
    is.String,
  );
  const count = ensure(
    await fn.getbufvar(denops, buf, `${varPrefix}_frames`),
    is.Number,
  );
  const interval = ensure(
    await fn.getbufvar(denops, buf, `${varPrefix}_interval`),
    is.Number,
  );
  let frame = 0;
  return setInterval(async () => {
    await sign(denops, buf, `${varPrefix}_${kind}_${frame}`);
    frame = (frame + 1) % count;
  }, interval);
}

export async function stop(denops: Denops, buf: number, id: number) {
  clearInterval(id);
  await denops.call("sign_unplace", signGroup, { buffer: buf });
}

// Show spinner in sign column at the bottom line. If it is already shown, update text.
async function sign(denops: Denops, buf: number, name: string) {
  await batch.batch(denops, async () => {
    await denops.call("sign_unplace", signGroup, { buffer: buf });
    await denops.call("sign_place", 0, signGroup, name, buf, { lnum: "w$" });
  });
}
