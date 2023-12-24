import {
  is,
  ObjectOf as O,
  Predicate as P,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";

// Definitions for the endpoint to "Create a model"
// Method: POST
// Endpoint: /api/create
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#create-a-model

const CreateModelParamFields = {
  // Name of the model to create
  name: is.String,
  // (optional) Contents of the Modelfile
  modelfile: is.OptionalOf(is.String),
  // (optional) If false the response will be returned as a single response object, rather than a stream of objects
  stream: is.OptionalOf(is.Boolean),
  // (optional) Path to the Modelfile
  path: is.OptionalOf(is.String),
};

export type CreateModelParam = O<
  typeof CreateModelParamFields
>;
export const isCreateModelParam: P<
  CreateModelParam
> = is.ObjectOf(
  CreateModelParamFields,
);

// TODO: implement
