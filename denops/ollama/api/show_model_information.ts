import {
  ensure,
  is,
  ObjectOf as O,
  Predicate as P,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";
import { doPost } from "./base.ts";
import { RequestOptions, Result } from "./types.ts";

// Definitions for the endpoint to "Show model information"
// Method: POST
// Endpoint: /api/show
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#show-model-information

const showModelInformationParamFields = {
  // Name of the model to show information about
  name: is.String,
};

export type ShowModelInformationParam = O<
  typeof showModelInformationParamFields
>;
export const isShowModelInformationParam: P<
  ShowModelInformationParam
> = is.ObjectOf(
  showModelInformationParamFields,
);

const showModelInformationResponseFields = {
  // The model file
  modelfile: is.String,

  // The parameters
  parameters: is.String,

  // The template
  template: is.String,

  // Details about the model
  details: is.ObjectOf({
    // Format of the model
    format: is.String,

    // Family of the model
    family: is.String,

    // Families of the model
    families: is.ArrayOf(is.String),

    // Size of the parameters
    parameter_size: is.String,

    // Quantization level of the model
    quantization_level: is.String,
  }),
};

export type ShowModelInformationResponse = O<
  typeof showModelInformationResponseFields
>;
export const isShowModelInformationResponse: P<
  ShowModelInformationResponse
> = is.ObjectOf(showModelInformationResponseFields);

/**
 * Show information about a model including details, modelfile, template, parameters, license, and system prompt.
 * @param param
 * @param options
 */
export async function showModelInformation(
  param: ShowModelInformationParam,
  options?: RequestOptions,
): Promise<Result<ShowModelInformationResponse>> {
  const response = await doPost("/api/show", param, options);
  return {
    response,
    body: ensure(response.json(), isShowModelInformationResponse),
  };
}
