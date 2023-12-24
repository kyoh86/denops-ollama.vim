import {
  ensure,
  is,
  ObjectOf as O,
  Predicate as P,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";
import {
  JSONLinesParseStream,
  type JSONValue,
} from "https://deno.land/x/jsonlines@v1.2.2/mod.ts";
import { isFormat, RequestOptions, Result } from "./types.ts";

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
  // (optional) The format to return a response in. Currently the only accepted value is json
  format: isFormat,
  // (optional) Additional model parameters listed in the documentation for the Modelfile such as temperature
  options: is.OptionalOf(is.Record),
  // (optional) System message to (overrides what is defined in the Modelfile)
  system: is.OptionalOf(is.String),
  // (optional) The full prompt or prompt template (overrides what is defined in the Modelfile)
  template: is.OptionalOf(is.String),
  // (optional) The context parameter returned from a previous request to /generate, this can be used to keep a short conversational memory
  context: is.OptionalOf(is.String),
  // (optional) If false the response will be returned as a single response object, rather than a stream of objects
  stream: is.OptionalOf(is.Boolean),
  // (optional) If true no formatting will be applied to the prompt. You may choose to use the raw parameter if you are specifying a full templated prompt in your request to the API.
  raw: is.OptionalOf(is.Boolean),
};

export type GenerateCompletionParam = O<
  typeof GenerateCompletionParamFields
>;
export const isGenerateCompletionParam: P<GenerateCompletionParam> = is
  .ObjectOf(
    GenerateCompletionParamFields,
  );

const GenerateCompletionResponseFields = {
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
  context: is.Unknown,
};

export type GenerateCompletionResponse = O<
  typeof GenerateCompletionResponseFields
>;
export const isGenerateCompletionResponse: P<GenerateCompletionResponse> = is
  .ObjectOf(
    GenerateCompletionResponseFields,
  );

/** Generate a response for a given prompt with a provided model.
 * This is a streaming endpoint, so there will be a series of responses.
 * The final response object will include statistics and additional data from the request.
 */
export async function generateCompletion(
  param: GenerateCompletionParam,
  options?: RequestOptions,
): Promise<Result<GenerateCompletionResponse[] | GenerateCompletionResponse>> {
  const response = await fetch(
    new URL("/api/generate", options?.baseUrl),
    {
      ...options?.init,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(param),
    },
  );
  //TODO: check response.status
  if (param.stream) {
    const body: GenerateCompletionResponse[] = [];
    await response.body
      ?.pipeThrough(new TextDecoderStream())
      .pipeThrough(new JSONLinesParseStream())
      .pipeTo(
        new WritableStream<JSONValue>({
          write: (chunk) => {
            const item = ensure(chunk, isGenerateCompletionResponse);
            body.push(item);
          },
        }),
      );
    return { response, body };
  }
  return {
    response,
    body: ensure(response.json(), isGenerateCompletionResponse),
  };
}
