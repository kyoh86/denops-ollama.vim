import { as, is, type PredicateType } from "jsr:@core/unknownutil@~4.1.0";
import { isErrorResponse, type ReqInit } from "./types.ts";
import { doPost } from "./base.ts";
import { parseJSONStream } from "./base.ts";

// Definitions for the endpoint to "Pull a model"
// Method: POST
// Endpoint: /api/pull
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#pull-a-model

export const isPullModelParams = is.ObjectOf({
  // (optional) Allow insecure connections to the library.
  // Only use this if you are pulling from your own library during development.
  insecure: as.Optional(is.Boolean),
});
export type PullModelParams = PredicateType<typeof isPullModelParams>;

export const isPullModelResponse = is.UnionOf([
  isErrorResponse,
  is.ObjectOf({
    // Status of the pull
    status: is.String,

    // Digest of the model
    digest: as.Optional(is.String),

    // Total size of the model
    total: as.Optional(is.Number),

    // Amount of the model that has been pulled
    completed: as.Optional(is.Number),
  }),
]);
export type PullModelResponse = PredicateType<typeof isPullModelResponse>;

/**
 * Pull a model
 * Download a model from the ollama library.
 * Cancelled pulls are resumed from where they left off, and multiple calls will share the same download progress.
 */
export async function pullModel(
  name: string,
  params?: PullModelParams,
  init?: ReqInit,
) {
  return parseJSONStream(
    await doPost("/api/pull", { name, ...params }, init),
    isPullModelResponse,
  );
}
