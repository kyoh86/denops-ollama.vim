import {
  ensure,
  is,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.17.2/mod.ts";
import { isErrorResponse, type ReqInit, type Result } from "./types.ts";
import { doPost } from "./base.ts";

// Definitions for the endpoint to "Generate embeddings"
// Method: POST
// Endpoint: /api/embeddings
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#generate-embeddings

export const isGenerateEmbeddingsParam = is.ObjectOf({});
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
  model: string,
  prompt: string,
  params?: GenerateEmbeddingsParam,
  init?: ReqInit,
): Promise<Result<GenerateEmbeddingsResponse>> {
  const response = await doPost(
    "/api/embeddings",
    { model, prompt, ...params },
    init,
  );
  return {
    response,
    body: ensure(await response.json(), isGenerateEmbeddingsResponse),
  };
}
