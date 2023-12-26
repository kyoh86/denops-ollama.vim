import { RequestOptions } from "./types.ts";

export function post(
  path: string,
  param: unknown,
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

export function get(
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

export function delete(
  path: string,
  options?: RequestOptions,
) {
  return fetch(
    new URL(path, options?.baseUrl),
    {
      ...options?.init,
      method: "DELETE",
    },
  );
}
