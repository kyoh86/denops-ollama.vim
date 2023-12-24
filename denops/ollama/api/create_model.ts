import {
  ensure,
  is,
  ObjectOf as O,
  Predicate as P,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";
import { RequestOptions, Result } from "./types.ts";
import { parseJSONStream } from "./stream.ts";
import { post } from "./request.ts";

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

const CreateModelResponseFields = {
  status: is.String,
};

export type CreateModelResponse = O<typeof CreateModelResponseFields>;
export const isCreateModelResponse: P<CreateModelResponse> = is
  .ObjectOf(
    CreateModelResponseFields,
  );

/**
 * Create a model from a Modelfile. It is recommended to set modelfile to the content of the Modelfile rather than just set path. This is a requirement for remote create. Remote model creation must also create any file blobs, fields such as FROM and ADAPTER, explicitly with the server using Create a Blob and the value to the path indicated in the response.
 */
export async function createModel(
  param: CreateModelParam,
  options?: RequestOptions,
): Promise<Result<CreateModelResponse[] | CreateModelResponse>> {
  const response = await post("/api/create", param, options);
  if (param.stream) {
    return await parseJSONStream(response, isCreateModelResponse);
  }
  return {
    response,
    body: ensure(response.json(), isCreateModelResponse),
  };
}
