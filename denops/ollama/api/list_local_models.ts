import {
  ensure,
  is,
  ObjectOf as O,
  Predicate as P,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";
import { RequestOptions, Result } from "./types.ts";
import { doGet } from "./base.ts";

// Definitions for the endpoint to "List local models"
// Method: GET
// Endpoint: /api/tags
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#list-local-models

const listLocalModelsResponseFields = {
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
};
export type ListLocalModelsResponse = O<
  typeof listLocalModelsResponseFields
>;
export const isListLocalModelsResponse: P<ListLocalModelsResponse> = is
  .ObjectOf(
    listLocalModelsResponseFields,
  );

/**
 * List models that are available locally.
 */
export async function listLocalModels(
  options?: RequestOptions,
): Promise<Result<ListLocalModelsResponse>> {
  const response = await doGet("/api/tags", options);
  return {
    response,
    body: ensure(await response.json(), isListLocalModelsResponse),
  };
}