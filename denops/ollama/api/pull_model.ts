import {
  ensure,
  is,
  ObjectOf as O,
  Predicate as P,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";
import { RequestOptions, Result } from "./types.ts";
import { post } from "./request.ts";
import { parseJSONStream } from "./stream.ts";

// Definitions for the endpoint to "Pull a model"
// Method: POST
// Endpoint: /api/pull
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#pull-a-model

const PullModelParamFields = {
  // Name of the model to pull
  name: is.String,

  // (optional) Allow insecure connections to the library.
  // Only use this if you are pulling from your own library during development.
  insecure: is.OptionalOf(is.Boolean),

  // (optional) If false the response will be returned as a single response object, rather than a stream of objects
  stream: is.OptionalOf(is.Boolean),
};

export type PullModelParam = O<
  typeof PullModelParamFields
>;
export const isPullModelParam: P<
  PullModelParam
> = is.ObjectOf(
  PullModelParamFields,
);

const PullModelResponseFields = {
  // Status of the pull
  status: is.String,

  // Digest of the model
  digest: is.OptionalOf(is.String),

  // Total size of the model
  total: is.OptionalOf(is.Number),

  // Amount of the model that has been pulled
  completed: is.OptionalOf(is.Number),
};

export type PullModelResponse = O<
  typeof PullModelResponseFields
>;
export const isPullModelResponse: P<
  PullModelResponse
> = is.ObjectOf(
  PullModelResponseFields,
);

/**
 * Pull a model
 * Download a model from the ollama library.
 * Cancelled pulls are resumed from where they left off, and multiple calls will share the same download progress.
 */
export async function pullModel(
  param: PullModelParam,
  options?: RequestOptions,
): Promise<Result<PullModelResponse[] | PullModelResponse>> {
  const response = await post("/api/pull", param, options);
  if (param.stream) {
    return await parseJSONStream(response, isPullModelResponse);
  }
  return {
    response,
    body: ensure(response.json(), isPullModelResponse),
  };
}
