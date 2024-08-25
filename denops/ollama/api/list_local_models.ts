import { ensure, is, type PredicateType } from "jsr:@core/unknownutil@~4.3.0";
import { isErrorResponse, type ReqInit, type Result } from "./types.ts";
import { doGet } from "./base.ts";

// Definitions for the endpoint to "List local models"
// Method: GET
// Endpoint: /api/tags
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#list-local-models

export const isListLocalModelsResponse = is.UnionOf([
  isErrorResponse,
  is.ObjectOf({
    models: is.ArrayOf(is.ObjectOf({
      name: is.String,
      modified_at: is.String,
      size: is.Number,
      digest: is.String,
      details: is.ObjectOf({
        format: is.String,
        family: is.String,
        families: is.Unknown,
        parameter_size: is.String,
        quantization_level: is.String,
      }),
    })),
  }),
]);
export type ListLocalModelsResponse = PredicateType<
  typeof isListLocalModelsResponse
>;

/**
 * List models that are available locally.
 */
export async function listLocalModels(
  init?: ReqInit,
): Promise<Result<ListLocalModelsResponse>> {
  const response = await doGet("/api/tags", init);
  return {
    response,
    body: ensure(await response.json(), isListLocalModelsResponse),
  };
}
