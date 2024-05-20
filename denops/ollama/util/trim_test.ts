import { test } from "https://deno.land/x/denops_test@v1.8.0/mod.ts";
import * as target from "./trim.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

test({
  mode: "all",
  name: "Just code block fence should be trimmed",
  fn: () => {
    const src = ["```", "hello", "```"].join("\n");
    const got = target.trimAroundCode(src);
    const want = "hello";
    assertEquals(got, want);
  },
});

test({
  mode: "all",
  name: "Descriptions around code block fence should be trimmed",
  fn: () => {
    const src = [
      "This is the example:",
      "```",
      "hello",
      "world",
      "```",
      "How abount this one?",
    ].join("\n");
    const got = target.trimAroundCode(src);
    const want = "hello\nworld";
    assertEquals(got, want);
  },
});

test({
  mode: "all",
  name: "Take first code block if there are multiple blocks",
  fn: () => {
    const src = [
      "This is the example:",
      "```",
      "hello",
      "world",
      "```",
      "How abount this one?",
      "```",
      "it's",
      "good-day",
      "```",
      "And how abount this too?",
    ].join("\n");
    const got = target.trimAroundCode(src);
    const want = "hello\nworld";
    assertEquals(got, want);
  },
});
