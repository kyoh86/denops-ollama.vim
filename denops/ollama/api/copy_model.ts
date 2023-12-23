import {
  is,
  ObjectOf as O,
  Predicate as P,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";

// Definitions for the endpoint to "Copy a model"
// Method: POST
// Endpoint: /api/copy
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#copy-a-model

const CopyModelParamFields = {
  // Name of the model to copy from
  source: is.String,
  // Name of the model to copy to
  destination: is.String,
};

export type CopyModelParamSchema = O<
  typeof CopyModelParamFields
>;
export const isCopyModelParam: P<
  CopyModelParamSchema
> = is.ObjectOf(
  CopyModelParamFields,
);
