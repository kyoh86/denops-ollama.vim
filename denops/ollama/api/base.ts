import {
  ensure,
  Predicate,
} from "https://deno.land/x/unknownutil@v3.18.0/mod.ts";
import {
  JSONLinesParseStream,
  type JSONValue,
} from "https://deno.land/x/jsonlines@v1.2.2/mod.ts";
import { ReqInit } from "./types.ts";

const defaultBaseUrl = "http://localhost:11434";

export function doPost<T>(
  path: string,
  param: T,
  init?: ReqInit,
): Promise<Response> {
  const baseUrl = init?.baseUrl ?? defaultBaseUrl;
  return fetch(
    new URL(path, baseUrl),
    {
      ...(init?.signal ? { signal: init?.signal } : {}),
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(param),
    },
  );
}

export function doGet(
  path: string,
  init?: ReqInit,
): Promise<Response> {
  const baseUrl = init?.baseUrl ?? defaultBaseUrl;
  return fetch(
    new URL(path, baseUrl),
    {
      ...(init?.signal ? { signal: init?.signal } : {}),
      method: "GET",
    },
  );
}

export function doDelete<T>(
  path: string,
  param: T,
  init?: ReqInit,
): Promise<Response> {
  const baseUrl = init?.baseUrl ?? defaultBaseUrl;
  return fetch(
    new URL(path, baseUrl),
    {
      ...(init?.signal ? { signal: init?.signal } : {}),
      method: "DELETE",
      body: JSON.stringify(param),
    },
  );
}

export async function parseJSONList<T>(
  response: Response,
  predicate: Predicate<T>,
): Promise<{
  response: Response;
  body: T[];
}> {
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

export function parseJSONStream<T>(
  response: Response,
  predicate: Predicate<T>,
): {
  response: Response;
  body: ReadableStream<T> | undefined;
} {
  return {
    response,
    body: response.body
      ?.pipeThrough(new TextDecoderStream())
      .pipeThrough(new JSONLinesParseStream())
      .pipeThrough(
        new TransformStream<JSONValue, T>({
          transform: (value, controller) => {
            const item = ensure(value, predicate);
            controller.enqueue(item);
          },
        }),
      ),
  };
}
