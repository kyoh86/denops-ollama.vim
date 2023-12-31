import {
  is,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.13.0/mod.ts";

// The format to return a response in. Currently the only accepted value is json
export const isFormat = is.OptionalOf(is.LiteralOf("json"));

export interface RequestOptions {
  baseUrl?: string | URL;
  signal?: AbortSignal;
}

export interface Result<T> {
  response: Response;
  body: T;
}

export const isErrorResponse = is.ObjectOf({
  error: is.String,
});
export type ErrorResponse = PredicateType<typeof isErrorResponse>;
