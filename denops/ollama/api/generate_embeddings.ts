import {
  is,
  ObjectOf as O,
  Predicate as P,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";

// Definitions for the endpoint to "Generate embeddings"
// Endpoint: /embeddings
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#generate-embeddings

const GenerateEmbeddingsParamFields = {
  //  Name of model to generate embeddings from
  model: is.String,
  // Text to generate embeddings for
  prompt: is.String,
};

export type GenerateEmbeddingsParamSchema = O<
  typeof GenerateEmbeddingsParamFields
>;
export const isGenerateEmbeddingsParam: P<GenerateEmbeddingsParamSchema> = is
  .ObjectOf(
    GenerateEmbeddingsParamFields,
  );
