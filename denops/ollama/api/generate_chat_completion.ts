import {
  is,
  ObjectOf as O,
  Predicate as P,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";
import { isFormat } from "./types.ts";

// Definitions for the endpoint to "Generate a chat completion"
// Method: POST
// Endpoint: /api/chat
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#generate-a-chat-completion

const GenerateChatCompletionMessageFields = {
  // The role of the message, either system, user or assistant
  role: is.LiteralOneOf(["system", "user", "assistant"]),
  // The content of the message
  content: is.String,
  // (optional) A list of images to include in the message (for multimodal models such as llava)
  images: is.OptionalOf(is.ArrayOf(is.String)),
};

export type GenerateChatCompletionMessage = O<
  typeof GenerateChatCompletionMessageFields
>;
export const isGenerateChatCompletionMessage: P<
  GenerateChatCompletionMessage
> = is.ObjectOf(
  GenerateChatCompletionMessageFields,
);

const GenerateChatCompletionParamFields = {
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
  typeof GenerateChatCompletionParamFields
>;
export const isGenerateChatCompletionParam: P<
  GenerateChatCompletionParam
> = is.ObjectOf(
  GenerateChatCompletionParamFields,
);

// TODO: implement
