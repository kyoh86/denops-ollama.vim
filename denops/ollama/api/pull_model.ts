import {
  is,
  ObjectOf as O,
  Predicate as P,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";

// Definitions for the endpoint to "Pull a model"
// Endpoint: /pull
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#pull-a-model

const PullModelParamFields = {
  // Name of the model to pull
  name: is.String,

  // (optional) Allow insecure connections to the library.
  // Only use this if you are pulling from your own library during development.
  insecure: is.OptionalOf(is.Boolean),

  // (optional) If false the response will be returned as a single response object, rather than a stream of objects
  stream: is.OptionalOf(is.Boolean),
};

export type PullModelParamSchema = O<
  typeof PullModelParamFields
>;
export const isPullModelParam: P<
  PullModelParamSchema
> = is.ObjectOf(
  PullModelParamFields,
);