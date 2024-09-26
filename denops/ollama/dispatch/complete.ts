import type { Denops } from "jsr:@denops/std@~7.2.0";
import { as, is, type PredicateType } from "jsr:@core/unknownutil@~4.3.0";
import { generateCompletion } from "../api.ts";
import { isReqArgs } from "./types.ts";
import { getPrefix, getSuffix } from "../util/context.ts";
import { canceller } from "../util/cancellable.ts";
import { trimAroundCode } from "../util/trim.ts";

export const isCompleteArgs = is.IntersectionOf([
  is.ObjectOf({
    model: is.String,
    callback: is.Unknown,
    // A list of base64-encoded images (for multimodal models such as llava)
    images: as.Optional(is.ArrayOf(is.String)),
    // Additional model parameters listed in the documentation for the Modelfile such as temperature
    options: as.Optional(is.Record),
    // System message to (overrides what is defined in the Modelfile)
    system: as.Optional(is.String),
  }),
  isReqArgs,
]);

export type CompleteArgs = PredicateType<typeof isCompleteArgs>;

export async function complete<T>(
  denops: Denops,
  args: Omit<CompleteArgs, "callback"> & {
    callback:
      | ((messasge: string) => T)
      | ((messasge: string) => Promise<T>);
  },
): Promise<T> {
  const prefix = await getPrefix(denops);
  const suffix = await getSuffix(denops);
  const { signal, cancel } = await canceller(denops, args?.timeout);
  try {
    const result = await generateCompletion(
      args.model,
      [
        "<PRE>",
        ...prefix.lines,
        "<SUF>",
        ...suffix.lines,
        "<MID>",
      ].join("\n"),
      {
        images: args.images,
        options: args.options,
        system: args.system,
        stream: false,
      },
      { baseUrl: args.baseUrl, signal },
    );
    if ("error" in result.body) {
      throw new Error(result.body.error);
    }
    const ret = args.callback(trimAroundCode(result.body.response));
    if (ret instanceof Promise) {
      return await ret;
    }
    return ret;
  } finally {
    await cancel();
  }
}
