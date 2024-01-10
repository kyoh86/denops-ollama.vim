import {
  is,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.13.0/mod.ts";
import { isErrorResponse, type ReqInit } from "./types.ts";
import { parseJSONStream } from "./base.ts";
import { doPost } from "./base.ts";

// Definitions for the endpoint to "Push a model"
// Method: POST
// Endpoint: /api/push
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#push-a-model

export const isPushModelParam = is.ObjectOf({
  // Name of the model to push in the form of `<namespace>/<model>:<tag>`
  name: is.String,

  // (optional) Allow insecure connections to the library.
  // Only use this if you are pushing from your own library during development.
  insecure: is.OptionalOf(is.Boolean),

  // (optional) If false the response will be returned as a single response object, rather than a stream of objects
  stream: is.OptionalOf(is.Boolean),
});
export type PushModelParam = PredicateType<typeof isPushModelParam>;

export const isPushModelResponse = is.OneOf([
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
export type PushModelResponse = PredicateType<typeof isPushModelResponse>;

/** Generate a response for a given prompt with a provided model.
 * This is a streaming endpoint, so there will be a series of responses.
 * The final response object will include statistics and additional data from the request.
 */
export async function pushModel(
  param: PushModelParam,
  init?: ReqInit,
) {
  return parseJSONStream(
    await doPost("/api/push", param, init),
    isPushModelResponse,
  );
}
