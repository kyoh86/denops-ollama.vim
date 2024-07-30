import { is, type PredicateType } from "jsr:@core/unknownutil@3.18.1";

// The format to return a response in. Currently the only accepted value is json
export const isFormat = is.OptionalOf(is.LiteralOf("json"));

export interface ReqInit {
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
