import {
  is,
  ObjectOf as O,
  Predicate as P,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";
import { RequestOptions, Result } from "./types.ts";
import { doDelete } from "./base.ts";

// Definitions for the endpoint to "Delete a model"
// Method: DELETE
// Endpoint: /api/delete
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#delete-a-model

const deleteModelParamFields = {
  // Model name to delete
  name: is.String,
};

export type DeleteModelParam = O<
  typeof deleteModelParamFields
>;
export const isDeleteModelParam: P<
  DeleteModelParam
> = is.ObjectOf(
  deleteModelParamFields,
);

/** Copy a model. Creates a model with another name from an existing model. */
export async function deleteModel(
  params: DeleteModelParam,
  options?: RequestOptions,
): Promise<Result<undefined>> {
  const response = await doDelete("/api/delete", params, options);
  return {
    response,
    body: undefined,
  };
}
