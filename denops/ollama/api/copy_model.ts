import type { ReqInit, Result } from "./types.ts";
import { doPost } from "./base.ts";
import {
  is,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.17.2/mod.ts";

// Definitions for the endpoint to "Copy a model"
// Method: POST
// Endpoint: /api/copy
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#copy-a-model

export const isCopyModelParams = is.ObjectOf({});
export type CopyModelParams = PredicateType<
  typeof isCopyModelParams
>;

/** Copy a model. Creates a model with another name from an existing model. */
export async function copyModel(
  // Name of the model to copy from
  source: string,
  // Name of the model to copy to
  destination: string,
  params?: CopyModelParams,
  init?: ReqInit,
): Promise<Result<undefined>> {
  const response = await doPost(
    "/api/copy",
    { source, destination, ...params },
    init,
  );
  return {
    response,
    body: undefined,
  };
}
