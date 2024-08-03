import { is, type PredicateType } from "jsr:@core/unknownutil@~3.18.1";
import { isErrorResponse, isFormat, type ReqInit } from "./types.ts";
import { parseJSONStream } from "./base.ts";
import { doPost } from "./base.ts";

// Definitions for the endpoint to "Generate a chat completion"
// Method: POST
// Endpoint: /api/chat
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#generate-a-chat-completion

export const isGenerateChatCompletionMessage = is.ObjectOf({
  // The role of the message, either system, user or assistant
  role: is.LiteralOneOf(["system", "user", "assistant"]),
  // The content of the message
  content: is.String,
  // (optional) A list of images to include in the message (for multimodal models such as llava)
  images: is.OptionalOf(is.ArrayOf(is.String)),
});
export type GenerateChatCompletionMessage = PredicateType<
  typeof isGenerateChatCompletionMessage
>;

export const isGenerateChatCompletionParams = is.ObjectOf({
  // The format to return a response in. Currently the only accepted value is json
  format: isFormat,

  // Additional model parameters listed in the documentation for the Modelfile such as temperature
  options: is.OptionalOf(is.Record),

  // The full prompt or prompt template (overrides what is defined in the Modelfile)
  template: is.OptionalOf(is.String),

  // If false the response will be returned as a single response object, rather than a stream of objects
  stream: is.OptionalOf(is.Boolean),
});
export type GenerateChatCompletionParams = PredicateType<
  typeof isGenerateChatCompletionParams
>;

/** The response from the generate chat completion endpoint */
export const isGenerateChatCompletionResponse = is.OneOf([
  isErrorResponse,
  is.ObjectOf({
    // The model that was used
    model: is.String,

    // The time the request was created
    created_at: is.String,

    // The message that was generated
    message: isGenerateChatCompletionMessage,

    // Whether the request is done
    done: is.LiteralOf(false),
  }),
  is.ObjectOf({
    // The model that was used
    model: is.String,

    // The time the request was created
    created_at: is.String,

    // The message that was generated
    message: is.OptionalOf(isGenerateChatCompletionMessage),

    // Whether the request is done
    done: is.LiteralOf(true),

    // The total duration of the request
    total_duration: is.Number,

    // The duration of loading the model
    load_duration: is.Number,

    // The number of times the prompt was evaluated
    prompt_eval_count: is.Number,

    // The duration of evaluating the prompt
    prompt_eval_duration: is.Number,

    // The duration of evaluating the model
    eval_duration: is.Number,

    // The number of times the model was evaluated
    eval_count: is.OptionalOf(is.Number),
  }),
]);
export type GenerateChatCompletionResponse = PredicateType<
  typeof isGenerateChatCompletionResponse
>;

/**
 * Generate the next message in a chat with a provided model.
 * This is a streaming endpoint, so there will be a series of responses.
 * Streaming can be disabled using "stream": false.
 * The final response object will include statistics and additional data from the request.
 */
export async function generateChatCompletion(
  model: string,
  // The messages of the chat, this can be used to keep a chat memory
  messages: GenerateChatCompletionMessage[],
  params?: GenerateChatCompletionParams,
  init?: ReqInit,
) {
  return parseJSONStream(
    await doPost("/api/chat", { model, messages, ...params }, init),
    isGenerateChatCompletionResponse,
  );
}
