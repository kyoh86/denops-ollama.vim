import {
  is,
  ObjectOf as O,
  Predicate as P,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";

// Definitions for the endpoint to "Show model information"
// Method: POST
// Endpoint: /api/show
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#show-model-information

const ShowModelInformationParamFields = {
  // Name of the model to show information about
  name: is.String,
};

export type ShowModelInformationParam = O<
  typeof ShowModelInformationParamFields
>;
export const isShowModelInformationParam: P<
  ShowModelInformationParam
> = is.ObjectOf(
  ShowModelInformationParamFields,
);

// TODO: implement
