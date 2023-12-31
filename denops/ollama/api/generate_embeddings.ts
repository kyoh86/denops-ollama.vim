import {
  ensure,
  is,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.13.0/mod.ts";
import { isErrorResponse, type RequestOptions, type Result } from "./types.ts";
import { doPost } from "./base.ts";

// Definitions for the endpoint to "Generate embeddings"
// Method: POST
// Endpoint: /api/embeddings
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#generate-embeddings

export const isGenerateEmbeddingsParam = is.ObjectOf({
  //  Name of model to generate embeddings from
  model: is.String,
  // Text to generate embeddings for
  prompt: is.String,
});
export type GenerateEmbeddingsParam = PredicateType<
  typeof isGenerateEmbeddingsParam
>;

export const isGenerateEmbeddingsResponse = is.OneOf([
  isErrorResponse,
  is.ObjectOf({
    embedding: is.ArrayOf(is.Number),
  }),
]);
export type GenerateEmbeddingsResponse = PredicateType<
  typeof isGenerateEmbeddingsResponse
>;

/** Generate embeddings from a model. */
export async function generateEmbeddings(
  params: GenerateEmbeddingsParam,
  options?: RequestOptions,
): Promise<Result<GenerateEmbeddingsResponse>> {
  const response = await doPost("/api/embeddings", params, options);
  return {
    response,
    body: ensure(await response.json(), isGenerateEmbeddingsResponse),
  };
}
