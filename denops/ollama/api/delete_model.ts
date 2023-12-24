import {
  is,
  ObjectOf as O,
  Predicate as P,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";

// Definitions for the endpoint to "Delete a model"
// Method: DELETE
// Endpoint: /api/delete
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#delete-a-model

const DeleteModelParamFields = {
  // Model name to delete
  name: is.String,
};

export type DeleteModelParam = O<
  typeof DeleteModelParamFields
>;
export const isDeleteModelParam: P<
  DeleteModelParam
> = is.ObjectOf(
  DeleteModelParamFields,
);

// TODO: implement
