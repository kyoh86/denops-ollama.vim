import {
  ensure,
  is,
  ObjectOf as O,
  Predicate as P,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";
import { isFormat, RequestOptions, Result } from "./types.ts";
import { parseJSONList } from "./base.ts";
import { doPost } from "./base.ts";

// Definitions for the endpoint to "Generate a chat completion"
// Method: POST
// Endpoint: /api/chat
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#generate-a-chat-completion

const generateChatCompletionMessageFields = {
  // The role of the message, either system, user or assistant
  role: is.LiteralOneOf(["system", "user", "assistant"]),
  // The content of the message
  content: is.String,
  // (optional) A list of images to include in the message (for multimodal models such as llava)
  images: is.OptionalOf(is.ArrayOf(is.String)),
};

export type GenerateChatCompletionMessage = O<
  typeof generateChatCompletionMessageFields
>;
export const isGenerateChatCompletionMessage: P<
  GenerateChatCompletionMessage
> = is.ObjectOf(
  generateChatCompletionMessageFields,
);

const generateChatCompletionParamFields = {
  // Basic parameters:
  // The model name
  model: is.String,

  // The messages of the chat, this can be used to keep a chat memory
  messages: is.ArrayOf(isGenerateChatCompletionMessage),

  // Advanced parameters (optional):

  // The format to return a response in. Currently the only accepted value is json
  format: isFormat,

  // Additional model parameters listed in the documentation for the Modelfile such as temperature
  options: is.OptionalOf(is.Record),

  // The full prompt or prompt template (overrides what is defined in the Modelfile)
  template: is.OptionalOf(is.String),

  // If false the response will be returned as a single response object, rather than a stream of objects
  stream: is.OptionalOf(is.Boolean),
};

export type GenerateChatCompletionParam = O<
  typeof generateChatCompletionParamFields
>;
export const isGenerateChatCompletionParam: P<
  GenerateChatCompletionParam
> = is.ObjectOf(
  generateChatCompletionParamFields,
);

/** The response from the generate chat completion endpoint */
const GenerateChatCompletionResponseFields = {
  // The model that was used
  model: is.String,

  // The time the request was created
  created_at: is.String,

  // The message that was generated
  message: is.OptionalOf(is.ObjectOf({
    // The role of the message, either system, user or assistant
    role: is.LiteralOneOf(["system", "user", "assistant"]),

    // The content of the message
    content: is.String,

    // (optional) A list of images to include in the message (for multimodal models such as llava)
    images: is.OptionalOf(is.ArrayOf(is.String)),
  })),

  // Whether the request is done
  done: is.Boolean,

  // The total duration of the request
  total_duration: is.OptionalOf(is.Number),

  // The duration of loading the model
  load_duration: is.OptionalOf(is.Number),

  // The number of times the prompt was evaluated
  prompt_eval_count: is.OptionalOf(is.Number),

  // The duration of evaluating the prompt
  prompt_eval_duration: is.OptionalOf(is.Number),

  // The number of times the model was evaluated
  eval_count: is.OptionalOf(is.Number),

  // The duration of evaluating the model
  eval_duration: is.OptionalOf(is.Number),
};

export type GenerateChatCompletionResponse = O<
  typeof GenerateChatCompletionResponseFields
>;

export const isGenerateChatCompletionResponse: P<
  GenerateChatCompletionResponse
> = is.ObjectOf(GenerateChatCompletionResponseFields);

export async function generateChatCompletion(
  param: GenerateChatCompletionParam & { stream?: true },
  options?: RequestOptions,
): Promise<Result<GenerateChatCompletionResponse[]>>;

export async function generateChatCompletion(
  param: GenerateChatCompletionParam & { stream: false },
  options?: RequestOptions,
): Promise<Result<GenerateChatCompletionResponse>>;

/**
 * Generate the next message in a chat with a provided model.
 * This is a streaming endpoint, so there will be a series of responses.
 * Streaming can be disabled using "stream": false.
 * The final response object will include statistics and additional data from the request.
 */
export async function generateChatCompletion(
  param: GenerateChatCompletionParam,
  options?: RequestOptions,
): Promise<
  Result<GenerateChatCompletionResponse[] | GenerateChatCompletionResponse>
> {
  const response = await doPost("/api/chat", param, options);
  if (param.stream === undefined || param.stream) {
    return await parseJSONList(response, isGenerateChatCompletionResponse);
  }
  return {
    response,
    body: ensure(await response.json(), isGenerateChatCompletionResponse),
  };
}
