import { test } from "jsr:@denops/test@~3.0.2";
import * as target from "./trim.ts";
import { assertEquals } from "jsr:@std/assert@~1.0.1";

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
