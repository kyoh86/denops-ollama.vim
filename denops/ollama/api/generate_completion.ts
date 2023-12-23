import {
  is,
  ObjectOf as O,
  Predicate as P,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";
import { isFormat } from "./types.ts";

// Definitions for the endpoint to "Generate a completion"
// Method: POST
// Endpoint: /api/generate
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#generate-a-completion

const GenerateCompletionParamFields = {
  // The model name
  model: is.String,
  // The prompt to generate a response for
  prompt: is.String,
  // (optional) A list of base64-encoded images (for multimodal models such as llava)
  images: is.OptionalOf(is.ArrayOf(is.String)),

  // Advanced parameters (optional):

  // The format to return a response in. Currently the only accepted value is json
  format: isFormat,

  // Additional model parameters listed in the documentation for the Modelfile such as temperature
  options: is.OptionalOf(is.Record),

  // System message to (overrides what is defined in the Modelfile)
  system: is.OptionalOf(is.String),

  // The full prompt or prompt template (overrides what is defined in the Modelfile)
  template: is.OptionalOf(is.String),

  // The context parameter returned from a previous request to /generate, this can be used to keep a short conversational memory
  context: is.OptionalOf(is.String),

  // If false the response will be returned as a single response object, rather than a stream of objects
  stream: is.OptionalOf(is.Boolean),

  // If true no formatting will be applied to the prompt. You may choose to use the raw parameter if you are specifying a full templated prompt in your request to the API.
  raw: is.OptionalOf(is.Boolean),
};

export type GenerateCompletionParamSchema = O<
  typeof GenerateCompletionParamFields
>;
export const isGenerateCompletionParam: P<GenerateCompletionParamSchema> = is
  .ObjectOf(
    GenerateCompletionParamFields,
  );
