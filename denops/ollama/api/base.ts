import {
  ensure,
  Predicate,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";
import {
  JSONLinesParseStream,
  type JSONValue,
} from "https://deno.land/x/jsonlines@v1.2.2/mod.ts";
import { RequestOptions } from "./types.ts";

export function doPost<T>(
  path: string,
  param: T,
  options?: RequestOptions,
) {
  return fetch(
    new URL(path, options?.baseUrl),
    {
      ...options?.init,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(param),
    },
  );
}

export function doGet(
  path: string,
  options?: RequestOptions,
) {
  return fetch(
    new URL(path, options?.baseUrl),
    {
      ...options?.init,
      method: "GET",
    },
  );
}

export function doDelete<T>(
  path: string,
  param: T,
  options?: RequestOptions,
) {
  return fetch(
    new URL(path, options?.baseUrl),
    {
      ...options?.init,
      method: "DELETE",
      body: JSON.stringify(param),
    },
  );
}

export async function parseJSONStream<T>(
  response: Response,
  predicate: Predicate<T>,
) {
  const body: T[] = [];
  await response.body
    ?.pipeThrough(new TextDecoderStream())
    .pipeThrough(new JSONLinesParseStream())
    .pipeTo(
      new WritableStream<JSONValue>({
        write: (chunk) => {
          const item = ensure(chunk, predicate);
          body.push(item);
        },
      }),
    );
  return { response, body };
}
