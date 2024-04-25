import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  assertSpyCallArgs,
  assertSpyCalls,
  stub,
} from "https://deno.land/std@0.224.0/testing/mock.ts";
import {
  generateCompletion,
  GenerateCompletionResponse,
} from "./generate_completion.ts";

Deno.test("generateCompletion", async (t) => {
  await t.step("with default calling", async (t) => {
    const fetchStub = stub(globalThis, "fetch", () => {
      const output =
        `{"model":"llama2","created_at":"2023-08-04T19:22:45.499127Z","response":"The sky is blue because it is the color of the sky.","done":true,"context":[1,2,3],"total_duration":5043500667,"load_duration":5025959,"prompt_eval_count":26,"prompt_eval_duration":325953000,"eval_count":290,"eval_duration":4709213000}`;
      return Promise.resolve(
        new Response(output, {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });
    try {
      await t.step("should call fetch with the correct arguments", async () => {
        const result = await generateCompletion(
          "model1",
          "How to run?",
        );
        assertEquals(result.response.status, 200);
        assertSpyCalls(fetchStub, 1);
        assertSpyCallArgs(fetchStub, 0, [
          new URL("http://localhost:11434/api/generate"),
          {
            body: '{"model":"model1","prompt":"How to run?"}',
            headers: { "Content-Type": "application/json" },
            method: "POST",
          },
        ]);
        const actual: GenerateCompletionResponse[] = [];
        await result.body?.pipeTo(
          new WritableStream({
            write: (chunk) => {
              actual.push(chunk);
            },
          }),
        );
        const expected = {
          "model": "llama2",
          "created_at": "2023-08-04T19:22:45.499127Z",
          "response": "The sky is blue because it is the color of the sky.",
          "done": true,
          "context": [1, 2, 3],
          "total_duration": 5043500667,
          "load_duration": 5025959,
          "prompt_eval_count": 26,
          "prompt_eval_duration": 325953000,
          "eval_count": 290,
          "eval_duration": 4709213000,
        };
        assertEquals(actual.length, 1);
        assertEquals(actual[0], expected);
      });
    } finally {
      fetchStub.restore();
    }
  });

  await t.step("with some options", async (t) => {
    const fetchStub = stub(globalThis, "fetch", () => {
      const output =
        `{"model":"llama2","created_at":"2023-08-04T08:52:19.385406455-07:00","response":"The","done":false}
{"model":"llama2","created_at":"2023-08-04T19:22:45.499127Z","response":"","done":true,"context":[1,2,3],"total_duration":10706818083,"load_duration":6338219291,"prompt_eval_count":26,"prompt_eval_duration":130079000,"eval_count":259,"eval_duration":4232710000}`;
      return Promise.resolve(new Response(output, { status: 200 }));
    });
    try {
      await t.step("should call fetch with the correct arguments", async () => {
        const result = await generateCompletion(
          "model1",
          "run",
          {
            context: [1, 2, 3],
            format: "json",
            images: ["foo-image-1", "foo-image-2"],
            system: "foo-system",
            raw: true,
            template: "How to %s?",
          },
          {
            baseUrl: "https://example.com:33562",
          },
        );
        assertEquals(result.response.status, 200);
        assertSpyCalls(fetchStub, 1);
        assertSpyCallArgs(fetchStub, 0, [
          new URL("https://example.com:33562/api/generate"),
          {
            body:
              '{"model":"model1","prompt":"run","context":[1,2,3],"format":"json","images":["foo-image-1","foo-image-2"],"system":"foo-system","raw":true,"template":"How to %s?"}',
            headers: { "Content-Type": "application/json" },
            method: "POST",
          },
        ]);
        const expected: GenerateCompletionResponse[] = [{
          "model": "llama2",
          "created_at": "2023-08-04T08:52:19.385406455-07:00",
          "response": "The",
          "done": false,
        }, {
          "model": "llama2",
          "created_at": "2023-08-04T19:22:45.499127Z",
          "response": "",
          "done": true,
          "context": [1, 2, 3],
          "total_duration": 10706818083,
          "load_duration": 6338219291,
          "prompt_eval_count": 26,
          "prompt_eval_duration": 130079000,
          "eval_count": 259,
          "eval_duration": 4232710000,
        }];
        const actual: GenerateCompletionResponse[] = [];
        await result.body?.pipeTo(
          new WritableStream({
            write: (chunk) => {
              actual.push(chunk);
            },
          }),
        );
        assertEquals(actual.length, 2);
        assertEquals(actual, expected);
      });
    } finally {
      fetchStub.restore();
    }
  });
});
