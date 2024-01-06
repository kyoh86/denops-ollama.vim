import {
  is,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";
import { isErrorResponse, type RequestOptions } from "./types.ts";
import { doPost } from "./base.ts";
import { parseJSONStream } from "./base.ts";

// Definitions for the endpoint to "Pull a model"
// Method: POST
// Endpoint: /api/pull
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#pull-a-model

export const isPullModelParam = is.ObjectOf({
  // Name of the model to pull
  name: is.String,

  // (optional) Allow insecure connections to the library.
  // Only use this if you are pulling from your own library during development.
  insecure: is.OptionalOf(is.Boolean),

  // (optional) If false the response will be returned as a single response object, rather than a stream of objects
  stream: is.OptionalOf(is.Boolean),
});
export type PullModelParam = PredicateType<typeof isPullModelParam>;

export const isPullModelResponse = is.OneOf([
  isErrorResponse,
  is.ObjectOf({
    // Status of the pull
    status: is.String,

    // Digest of the model
    digest: is.OptionalOf(is.String),

    // Total size of the model
    total: is.OptionalOf(is.Number),

    // Amount of the model that has been pulled
    completed: is.OptionalOf(is.Number),
  }),
]);
export type PullModelResponse = PredicateType<typeof isPullModelResponse>;

/**
 * Pull a model
 * Download a model from the ollama library.
 * Cancelled pulls are resumed from where they left off, and multiple calls will share the same download progress.
 */
export async function pullModel(
  param: PullModelParam,
  options?: RequestOptions,
) {
  return parseJSONStream(
    await doPost("/api/pull", param, options),
    isPullModelResponse,
  );
}
