import {
  is,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.13.0/mod.ts";
import { isErrorResponse, type RequestOptions } from "./types.ts";
import { parseJSONStream } from "./base.ts";
import { doPost } from "./base.ts";

// Definitions for the endpoint to "Generate a completion"
// Method: POST
// Endpoint: /api/generate
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#generate-a-completion

export const isGenerateCompletionResponse = is.OneOf([
  isErrorResponse,
  is.ObjectOf({
    // The model name
    model: is.String,
    // The time the request was received
    created_at: is.String,
    // Empty if the response was streamed, if not streamed, this will contain the full response
    response: is.String,
    // The response stream has ended
    done: is.Boolean,
    // Time spent generating the response
    total_duration: is.OptionalOf(is.Number),
    // Time spent in nanoseconds loading the model
    load_duration: is.OptionalOf(is.Number),
    // Number of tokens in the prompt
    prompt_eval_count: is.OptionalOf(is.Number),
    // Time spent in nanoseconds evaluating the prompt
    prompt_eval_duration: is.OptionalOf(is.Number),
    // Number of tokens the response
    eval_count: is.OptionalOf(is.Number),
    // Time in nanoseconds spent generating the response
    eval_duration: is.OptionalOf(is.Number),
    // An encoding of the conversation used in this response, this can be sent in the next request to keep a conversational memory
    context: is.OptionalOf(is.ArrayOf(is.Number)),
  }),
]);
export type GenerateCompletionResponse = PredicateType<
  typeof isGenerateCompletionResponse
>;

export type GenerateCompletionParam = {
  // A list of base64-encoded images (for multimodal models such as llava)
  images?: string[] | undefined;
  // The format to return a response in. Currently the only accepted value is json
  format?: "json" | undefined;
  // Additional model parameters listed in the documentation for the Modelfile such as temperature
  options?: Record<PropertyKey, unknown> | undefined;
  // System message to (overrides what is defined in the Modelfile)
  system?: string | undefined;
  // The full prompt or prompt template (overrides what is defined in the Modelfile)
  template?: string | undefined;
  // The context parameter returned from a previous request to /generate, this can be used to keep a short conversational memory
  context?: number[] | undefined;
  // If true no formatting will be applied to the prompt. You may choose to use the raw parameter if you are specifying a full templated prompt in your request to the API.
  raw?: boolean | undefined;
};

/** Generate a response for a given prompt with a provided model.
 * This is a streaming endpoint, so there will be a series of responses.
 * The final response object will include statistics and additional data from the request.
 */
export async function generateCompletion(
  // The model name
  model: string,
  // The prompt to generate a response for
  prompt: string,
  param?: GenerateCompletionParam,
  options?: RequestOptions,
) {
  return parseJSONStream(
    await doPost("/api/generate", { model, prompt, ...param }, options),
    isGenerateCompletionResponse,
  );
}
