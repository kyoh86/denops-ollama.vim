import {
  is,
  ObjectOf as O,
  Predicate as P,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";
import type { RequestOptions, Result } from "./types.ts";
import { doPost } from "./base.ts";

// Definitions for the endpoint to "Copy a model"
// Method: POST
// Endpoint: /api/copy
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#copy-a-model

const copyModelParamFields = {
  // Name of the model to copy from
  source: is.String,
  // Name of the model to copy to
  destination: is.String,
};

export type CopyModelParam = O<
  typeof copyModelParamFields
>;
export const isCopyModelParam: P<
  CopyModelParam
> = is.ObjectOf(
  copyModelParamFields,
);

/** Copy a model. Creates a model with another name from an existing model. */
export async function copyModel(
  param: CopyModelParam,
  options?: RequestOptions,
): Promise<Result<undefined>> {
  const response = await doPost("/api/copy", param, options);
  return {
    response,
    body: undefined,
  };
}
