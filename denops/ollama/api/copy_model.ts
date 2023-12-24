import {
  is,
  ObjectOf as O,
  Predicate as P,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";
import type { RequestOptions, Result } from "./types.ts";

// Definitions for the endpoint to "Copy a model"
// Method: POST
// Endpoint: /api/copy
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#copy-a-model

const CopyModelParamFields = {
  // Name of the model to copy from
  source: is.String,
  // Name of the model to copy to
  destination: is.String,
};

export type CopyModelParam = O<
  typeof CopyModelParamFields
>;
export const isCopyModelParam: P<
  CopyModelParam
> = is.ObjectOf(
  CopyModelParamFields,
);

/** Copy a model. Creates a model with another name from an existing model. */
export async function copyModel(
  params: CopyModelParam,
  options?: RequestOptions,
): Promise<Result<undefined>> {
  const response = await fetch(new URL("/api/copy", options?.baseUrl), {
    ...options?.init,
    method: "POST",
    body: JSON.stringify(params),
  });
  // TODO: check response status code
  return {
    response,
    body: undefined,
  };
}
