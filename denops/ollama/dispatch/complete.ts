import { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import {
  is,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.14.1/mod.ts";
import { generateCompletion, type GenerateCompletionParams } from "../api.ts";
import { isReqOpts } from "./types.ts";
import { getCurrent } from "../util/context.ts";
import { canceller } from "../util/cancellable.ts";
import { trimAroundCode } from "../util/trim.ts";

export const isCompleteOpts = is.AllOf([
  is.ObjectOf({
    timeout: is.OptionalOf(is.Number),
  }),
  isReqOpts,
]);

export type CompleteOpts = PredicateType<typeof isCompleteOpts>;

export default async function complete(
  denops: Denops,
  model: string,
  opts?: CompleteOpts,
  params?: GenerateCompletionParams,
): Promise<string> {
  const current = await getCurrent(denops);
  const { signal, cancel } = await canceller(denops, opts?.timeout);
  try {
    const result = await generateCompletion(
      model,
      [
        "These are the contents before the cursor.",
        ...current.lines.slice(-10, -1),
        "You must output just generated contents that follows them in 10 lines at most.",
        "You don't have to describe and repeating them.",
      ].join("\n"),
      { ...params, stream: false },
      { ...opts, signal },
    );
    if ("error" in result.body) {
      throw new Error(result.body.error);
    }
    return trimAroundCode(result.body.response);
  } finally {
    cancel();
  }
}
