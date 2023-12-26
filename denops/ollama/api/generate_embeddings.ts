import {
  ensure,
  is,
  ObjectOf as O,
  Predicate as P,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";
import { RequestOptions, Result } from "./types.ts";
import { post } from "./request.ts";

// Definitions for the endpoint to "Generate embeddings"
// Method: POST
// Endpoint: /api/embeddings
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#generate-embeddings

const GenerateEmbeddingsParamFields = {
  //  Name of model to generate embeddings from
  model: is.String,
  // Text to generate embeddings for
  prompt: is.String,
};

export type GenerateEmbeddingsParam = O<
  typeof GenerateEmbeddingsParamFields
>;
export const isGenerateEmbeddingsParam: P<GenerateEmbeddingsParam> = is
  .ObjectOf(
    GenerateEmbeddingsParamFields,
  );

const GenerateEmbeddingsResponseFields = {
  embedding: is.ArrayOf(is.Number),
};

export type GenerateEmbeddingsResponse = O<
  typeof GenerateEmbeddingsResponseFields
>;
export const isGenerateEmbeddingsResponse: P<
  GenerateEmbeddingsResponse
> = is.ObjectOf(GenerateEmbeddingsResponseFields);

/** Generate embeddings from a model. */
export async function generateEmbeddings(
  params: GenerateEmbeddingsParam,
  options?: RequestOptions,
): Promise<Result<GenerateEmbeddingsResponse>> {
  const response = await post("/api/embeddings", params, options);
  return {
    response,
    body: ensure(response.json(), isGenerateEmbeddingsResponse),
  };
}
