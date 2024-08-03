import { assertEquals } from "jsr:@std/assert@~1.0.1";
import {
  assertSpyCallArgs,
  assertSpyCalls,
  stub,
} from "jsr:@std/testing@~1.0.0/mock";
import { copyModel } from "./copy_model.ts";

Deno.test("copyModel", async (t) => {
  await t.step("with default calling", async (t) => {
    const fetchStub = stub(globalThis, "fetch", () => {
      return Promise.resolve(new Response(null, { status: 200 }));
    });
    try {
      await t.step("should call fetch with the correct arguments", async () => {
        const result = await copyModel(
          "model1",
          "model2",
        );
        assertEquals(result.response.status, 200);
        assertSpyCalls(fetchStub, 1);
        assertSpyCallArgs(fetchStub, 0, [
          new URL("http://localhost:11434/api/copy"),
          {
            body: '{"source":"model1","destination":"model2"}',
            headers: { "Content-Type": "application/json" },
            method: "POST",
          },
        ]);
      });
    } finally {
      fetchStub.restore();
    }
  });

  await t.step("with some options", async (t) => {
    const fetchStub = stub(globalThis, "fetch", () => {
      return Promise.resolve(new Response(null, { status: 200 }));
    });
    try {
      await t.step("should call fetch with the correct arguments", async () => {
        const result = await copyModel(
          "model1",
          "model2",
          {},
          {
            baseUrl: "https://example.com:33562",
          },
        );
        assertEquals(result.response.status, 200);
        assertSpyCalls(fetchStub, 1);
        assertSpyCallArgs(fetchStub, 0, [
          new URL("https://example.com:33562/api/copy"),
          {
            body: '{"source":"model1","destination":"model2"}',
            headers: { "Content-Type": "application/json" },
            method: "POST",
          },
        ]);
      });
    } finally {
      fetchStub.restore();
    }
  });
});
