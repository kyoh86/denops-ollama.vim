import { Denops } from "https://deno.land/x/denops_std@v6.0.1/mod.ts";
import {
  is,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.15.0/mod.ts";
import { generateCompletion } from "../api.ts";
import { isReqArgs } from "./types.ts";
import { getCurrent } from "../util/context.ts";
import { canceller } from "../util/cancellable.ts";
import { trimAroundCode } from "../util/trim.ts";

export const isCompleteArgs = is.AllOf([
  is.ObjectOf({
    model: is.String,
    callback: is.String,
    // A list of base64-encoded images (for multimodal models such as llava)
    images: is.OptionalOf(is.ArrayOf(is.String)),
    // Additional model parameters listed in the documentation for the Modelfile such as temperature
    options: is.OptionalOf(is.Record),
    // System message to (overrides what is defined in the Modelfile)
    system: is.OptionalOf(is.String),
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
  const current = await getCurrent(denops);
  const { signal, cancel } = await canceller(denops, args?.timeout);
  try {
    const result = await generateCompletion(
      args.model,
      [
        "These are the contents before the cursor.",
        ...current.lines.slice(-10, -1),
        "You must output just generated contents that follows them in 10 lines at most.",
        "You don't have to describe and repeating them.",
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
    cancel();
  }
}
