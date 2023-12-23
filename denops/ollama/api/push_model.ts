import {
  is,
  ObjectOf as O,
  Predicate as P,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";

// Definitions for the endpoint to "Push a model"
// Method: POST
// Endpoint: /api/push
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#push-a-model

const PushModelParamFields = {
  // Name of the model to push in the form of `<namespace>/<model>:<tag>`
  name: is.String,

  // (optional) Allow insecure connections to the library.
  // Only use this if you are pushing from your own library during development.
  insecure: is.OptionalOf(is.Boolean),

  // (optional) If false the response will be returned as a single response object, rather than a stream of objects
  stream: is.OptionalOf(is.Boolean),
};

export type PushModelParamSchema = O<
  typeof PushModelParamFields
>;
export const isPushModelParam: P<
  PushModelParamSchema
> = is.ObjectOf(
  PushModelParamFields,
);
