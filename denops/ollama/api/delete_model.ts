import type { ReqInit, Result } from "./types.ts";
import { doDelete } from "./base.ts";
import { is, type PredicateType } from "jsr:@core/unknownutil@~4.1.0";

// Definitions for the endpoint to "Delete a model"
// Method: DELETE
// Endpoint: /api/delete
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#delete-a-model

export const isDeleteModelParams = is.ObjectOf({});
export type DeleteModelParams = PredicateType<
  typeof isDeleteModelParams
>;

/** Copy a model. Creates a model with another name from an existing model. */
export async function deleteModel(
  name: string,
  params?: DeleteModelParams,
  init?: ReqInit,
): Promise<Result<undefined>> {
  const response = await doDelete("/api/delete", { name, ...params }, init);
  return {
    response,
    body: undefined,
  };
}
