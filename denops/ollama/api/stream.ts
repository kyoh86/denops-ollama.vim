import {
  ensure,
  Predicate,
} from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";
import {
  JSONLinesParseStream,
  type JSONValue,
} from "https://deno.land/x/jsonlines@v1.2.2/mod.ts";

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
