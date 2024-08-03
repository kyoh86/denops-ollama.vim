import { as, is, type PredicateType } from "jsr:@core/unknownutil@~4.0.0";
import { isErrorResponse, type ReqInit } from "./types.ts";
import { parseJSONStream } from "./base.ts";
import { doPost } from "./base.ts";

// Definitions for the endpoint to "Push a model"
// Method: POST
// Endpoint: /api/push
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#push-a-model

export const isPushModelParams = is.ObjectOf({
  // Allow insecure connections to the library.
  // Only use this if you are pushing from your own library during development.
  insecure: as.Optional(is.Boolean),

  // If false the response will be returned as a single response object, rather than a stream of objects
  stream: as.Optional(is.Boolean),
});
export type PushModelParams = PredicateType<typeof isPushModelParams>;

export const isPushModelResponse = is.UnionOf([
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
    total_duration: as.Optional(is.Number),
    // Time spent in nanoseconds loading the model
    load_duration: as.Optional(is.Number),
    // Number of tokens in the prompt
    prompt_eval_count: as.Optional(is.Number),
    // Time spent in nanoseconds evaluating the prompt
    prompt_eval_duration: as.Optional(is.Number),
    // Number of tokens the response
    eval_count: as.Optional(is.Number),
    // Time in nanoseconds spent generating the response
    eval_duration: as.Optional(is.Number),
    // An encoding of the conversation used in this response, this can be sent in the next request to keep a conversational memory
    context: as.Optional(is.ArrayOf(is.Number)),
  }),
]);
export type PushModelResponse = PredicateType<typeof isPushModelResponse>;

/** Generate a response for a given prompt with a provided model.
 * This is a streaming endpoint, so there will be a series of responses.
 * The final response object will include statistics and additional data from the request.
 */
export async function pushModel(
  name: string,
  param?: PushModelParams,
  init?: ReqInit,
) {
  return parseJSONStream(
    await doPost("/api/push", { name, ...param }, init),
    isPushModelResponse,
  );
}
