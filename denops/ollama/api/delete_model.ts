import {
  is,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.13.0/mod.ts";
import type { RequestInit, Result } from "./types.ts";
import { doDelete } from "./base.ts";

// Definitions for the endpoint to "Delete a model"
// Method: DELETE
// Endpoint: /api/delete
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#delete-a-model

export const isDeleteModelParam = is.ObjectOf({
  // Model name to delete
  name: is.String,
});
export type DeleteModelParam = PredicateType<typeof isDeleteModelParam>;

/** Copy a model. Creates a model with another name from an existing model. */
export async function deleteModel(
  params: DeleteModelParam,
  init?: RequestInit,
): Promise<Result<undefined>> {
  const response = await doDelete("/api/delete", params, init);
  return {
    response,
    body: undefined,
  };
}
