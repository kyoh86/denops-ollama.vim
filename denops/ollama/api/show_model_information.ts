import {
  ensure,
  is,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.16.1/mod.ts";
import { doPost } from "./base.ts";
import { isErrorResponse, type ReqInit, type Result } from "./types.ts";

// Definitions for the endpoint to "Show model information"
// Method: POST
// Endpoint: /api/show
// Usage: https://github.com/jmorganca/ollama/blob/main/docs/api.md#show-model-information

export const isShowModelInformationParam = is.ObjectOf({});
export type ShowModelInformationParam = PredicateType<
  typeof isShowModelInformationParam
>;

export const isShowModelInformationResponse = is.OneOf([
  isErrorResponse,
  is.ObjectOf({
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
  }),
]);
export type ShowModelInformationResponse = PredicateType<
  typeof isShowModelInformationResponse
>;

/**
 * Show information about a model including details, modelfile, template, parameters, license, and system prompt.
 * @param param
 * @param init
 */
export async function showModelInformation(
  name: string,
  param?: ShowModelInformationParam,
  init?: ReqInit,
): Promise<Result<ShowModelInformationResponse>> {
  const response = await doPost("/api/show", { name, ...param }, init);
  return {
    response,
    body: ensure(await response.json(), isShowModelInformationResponse),
  };
}
