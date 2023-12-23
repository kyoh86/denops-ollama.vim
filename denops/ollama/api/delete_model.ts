import {
  is,
  ObjectOf as O,
  Predicate as P,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";

// Definitions for the endpoint to "Delete a model"
// Endpoint: /delete
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#delete-a-model

const DeleteModelParamFields = {
  // Name of the model to delete
  name: is.String,
};

export type DeleteModelParamSchema = O<
  typeof DeleteModelParamFields
>;
export const isDeleteModelParam: P<
  DeleteModelParamSchema
> = is.ObjectOf(
  DeleteModelParamFields,
);
