import {
  is,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.17.2/mod.ts";
import { isErrorResponse, type ReqInit } from "./types.ts";
import { parseJSONStream } from "./base.ts";
import { doPost } from "./base.ts";

// Definitions for the endpoint to "Create a model"
// Method: POST
// Endpoint: /api/create
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#create-a-model

export const isCreateModelParams = is.ObjectOf({
  // Contents of the Modelfile
  modelfile: is.OptionalOf(is.String),
  // If false the response will be returned as a single response object, rather than a stream of objects
  stream: is.OptionalOf(is.Boolean),
  // Path to the Modelfile
  path: is.OptionalOf(is.String),
});
export type CreateModelParams = PredicateType<typeof isCreateModelParams>;

export const isCreateModelResponse = is.OneOf([
  isErrorResponse,
  is.ObjectOf({
    status: is.String,
  }),
]);
export type CreateModelResponse = PredicateType<typeof isCreateModelResponse>;

/**
 * Create a model from a Modelfile.
 * It is recommended to set modelfile to the content of the Modelfile rather than just set path.
 * This is a requirement for remote create.
 * Remote model creation must also create any file blobs, fields such as FROM and ADAPTER, explicitly with the server using Create a Blob and the value to the path indicated in the response.
 */
export async function createModel(
  name: string,
  params?: CreateModelParams,
  init?: ReqInit,
) {
  return parseJSONStream(
    await doPost("/api/create", { name, ...params }, init),
    isCreateModelResponse,
  );
}
