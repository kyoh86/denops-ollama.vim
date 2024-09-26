import { assert, assertEquals, assertFalse } from "jsr:@std/assert@~1.0.1";
import { test } from "jsr:@denops/test@~3.0.2";
import * as fn from "jsr:@denops/std@~7.2.0/function";
import * as option from "jsr:@denops/std@~7.2.0/option";
import * as testtarget from "./context.ts";

test({
  mode: "all",
  name: "isBufferInfo must accept number",
  fn: () => {
    assert(testtarget.isBufferInfo(1));
  },
});

test({
  mode: "all",
  name: "isBufferInfo must accept string (bufname)",
  fn: () => {
    assert(testtarget.isBufferInfo("%"));
  },
});

test({
  mode: "all",
  name: "isBufferInfo must accept getbufinfo() result",
  fn: async (denops) => {
    const bufinfo = await fn.getbufinfo(denops, "");
    assert(testtarget.isBufferInfo(bufinfo[0]));
  },
});

test({
  mode: "all",
  name: "isBufferInfo must NOT accept name only object",
  fn: () => {
    assertFalse(testtarget.isBufferInfo({ name: "foo" }));
  },
});

test({
  mode: "all",
  name: "isBufferInfo must NOT accept bufnr only object",
  fn: () => {
    assertFalse(testtarget.isBufferInfo({ bufnr: 1 }));
  },
});

test({
  mode: "all",
  name: "getCurrentBuffer should get current buffer content and the name",
  fn: async (denops) => {
    denops.cmd("file file-1");
    await fn.setline(denops, 1, ["foo", "bar", "baz"]);

    const buf = await testtarget.getCurrentBuffer(denops);
    assertEquals(buf.name, "file-1");
    assertEquals(buf.bufnr, 1);
    assertEquals(buf.content, "foo\nbar\nbaz");
  },
});

test({
  mode: "all",
  name:
    "getCurrentBuffer should get current buffer content and the name without another buffer",
  fn: async (denops) => {
    denops.cmd("file file-1");
    await fn.setbufline(denops, 1, 1, ["foo-1", "bar-1", "baz-1"]);
    denops.cmd("new file-2");
    await fn.setbufline(denops, 2, 1, ["foo-2", "bar-2", "baz-2"]);

    const buf = await testtarget.getCurrentBuffer(denops);
    assertEquals(buf.name, "file-2");
    assertEquals(buf.bufnr, 2);
    assertEquals(buf.content, "foo-2\nbar-2\nbaz-2");
  },
});

test({
  mode: "all",
  name: "getCurrentBuffer should get buffers and the name",
  fn: async (denops) => {
    denops.cmd("file file-1");
    await fn.setbufline(denops, 1, 1, ["foo-1", "bar-1", "baz-1"]);
    denops.cmd("new file-2");
    await fn.setbufline(denops, 2, 1, ["foo-2", "bar-2", "baz-2"]);
    denops.cmd("new file-3");
    await fn.setbufline(denops, 3, 1, ["foo-3", "bar-3", "baz-3"]);

    const buf1 = await testtarget.getBuffer(denops, 1);
    assertEquals(buf1.name, "file-1");
    assertEquals(buf1.bufnr, 1);
    assertEquals(buf1.content, "foo-1\nbar-1\nbaz-1");

    const buf2 = await testtarget.getBuffer(denops, "file-2");
    assertEquals(buf2.name, "file-2");
    assertEquals(buf2.bufnr, 2);
    assertEquals(buf2.content, "foo-2\nbar-2\nbaz-2");

    const buf3 = await testtarget.getBuffer(denops, {
      name: "spec-3",
      bufnr: 3,
    });
    assertEquals(buf3.name, "spec-3");
    assertEquals(buf3.bufnr, 3);
    assertEquals(buf3.content, "foo-3\nbar-3\nbaz-3");
  },
});

test({
  mode: "all",
  name:
    "getVisualSelection should get all content in multi-line selection (line-wise)",
  fn: async (denops) => {
    await fn.setbufline(denops, 1, 1, ["foo", "bar", "baz"]);
    await denops.cmd("normal! ggVGk");

    const content = await testtarget.getVisualSelection(denops);
    assertEquals(content, "foo\nbar\n");
  },
});

test({
  mode: "all",
  name:
    "getVisualSelection should get all content in single-line selection (line-wise)",
  fn: async (denops) => {
    await fn.setbufline(denops, 1, 1, ["foo", "bar", "baz"]);
    await denops.cmd("normal! ggV");

    const content = await testtarget.getVisualSelection(denops);
    assertEquals(content, "foo\n");
  },
});

test({
  mode: "all",
  name:
    "getVisualSelection should get all content in inverted multi-line selection (line-wise)",
  fn: async (denops) => {
    await fn.setbufline(denops, 1, 1, ["foo", "bar", "baz"]);
    await denops.cmd("normal! GVk");

    const content = await testtarget.getVisualSelection(denops);
    assertEquals(content, "bar\nbaz\n");
  },
});

test({
  mode: "all",
  name:
    "getVisualSelection should get all content in multi-line inclusive selection (character-wise)",
  fn: async (denops) => {
    await fn.setbufline(denops, 1, 1, ["fooa", "bara", "baza"]);
    await denops.cmd("normal! gg0lvjj0l");

    const content = await testtarget.getVisualSelection(denops);
    assertEquals(content, "ooa\nbara\nba");
  },
});

test({
  mode: "all",
  name:
    "getVisualSelection should get all content in 2-length inclusive selection (character-wise)",
  fn: async (denops) => {
    await fn.setbufline(denops, 1, 1, ["fooa", "bara", "baza"]);
    await denops.cmd("normal! gg0lvl");

    const content = await testtarget.getVisualSelection(denops);
    assertEquals(content, "oo");
  },
});

test({
  mode: "all",
  name:
    "getVisualSelection should get all content in 0-length esclusive selection (character-wise)",
  fn: async (denops) => {
    await fn.setbufline(denops, 1, 1, ["foo", "bar", "qux"]);
    await option.selection.set(denops, "exclusive");
    await denops.cmd("normal! gg0jlvl");

    const content = await testtarget.getVisualSelection(denops);
    assertEquals(content, "a");
  },
});

test({
  mode: "all",
  name:
    "getVisualSelection should get all content 1-length exclusive selection (character-wise)",
  fn: async (denops) => {
    await fn.setbufline(denops, 1, 1, ["foo", "bar", "qux"]);
    await option.selection.set(denops, "exclusive");
    await denops.cmd("normal! gg0jlv");

    const content = await testtarget.getVisualSelection(denops);
    assertEquals(content, "a");
  },
});

test({
  mode: "all",
  name:
    "getVisualSelection should get all content single-line inclusive selection (block-wise)",
  fn: async (denops) => {
    await fn.setbufline(denops, 1, 1, ["foo", "bar", "qux"]);
    await denops.cmd(`normal! gg0jll`);

    const content = await testtarget.getVisualSelection(denops);
    assertEquals(content, "ar");
  },
});

test({
  mode: "all",
  name:
    "getVisualSelection should get all content multi-line inclusive selection (block-wise)",
  fn: async (denops) => {
    await fn.setbufline(denops, 1, 1, ["foo", "bar", "qux"]);
    await denops.cmd(`normal! gg0jljl`);

    const content = await testtarget.getVisualSelection(denops);
    assertEquals(content, "ar\nux");
  },
});

test({
  mode: "all",
  name: "getPrefix should return empty when the cursor at the 0,0",
  fn: async (denops) => {
    await fn.setbufline(denops, 1, 1, ["foo", "bar", "qux"]);
    await denops.cmd(`normal! gg0`);

    const context = await testtarget.getPrefix(denops);
    assertEquals(context.lines.length, 0);
  },
});

test({
  mode: "all",
  name: "getPrefix should return first line when the cursor at the 1,0",
  fn: async (denops) => {
    await fn.setbufline(denops, 1, 1, ["foo", "bar", "qux"]);
    await denops.cmd(`normal! gg0j`);

    const context = await testtarget.getPrefix(denops);
    assertEquals(context.lines.length, 1);
    assertEquals(context.lines[0], "foo");
  },
});

test({
  mode: "all",
  name:
    "getPrefix should return fragment of the line when the cursor at middle of the line",
  fn: async (denops) => {
    await fn.setbufline(denops, 1, 1, ["foo", "bar", "qux"]);
    await denops.cmd(`normal! gg0jll`);

    const context = await testtarget.getPrefix(denops);
    assertEquals(context.lines.length, 2);
    assertEquals(context.lines[0], "foo");
    assertEquals(context.lines[1], "ba");
  },
});

test({
  mode: "all",
  name:
    "getPrefix should return full of the lines when the cursor at end of the buffer",
  fn: async (denops) => {
    await fn.setbufline(denops, 1, 1, ["foo", "bar", "qux"]);
    await denops.cmd(`normal! G$`);

    const context = await testtarget.getPrefix(denops);
    assertEquals(context.lines.length, 3);
    assertEquals(context.lines[0], "foo");
    assertEquals(context.lines[1], "bar");
    assertEquals(context.lines[2], "qu");
  },
});

test({
  mode: "all",
  name: "getSuffix should return full of the lines when the cursor at 0,0",
  fn: async (denops) => {
    await fn.setbufline(denops, 1, 1, ["foo", "bar", "qux"]);
    await denops.cmd(`normal! gg0`);

    const context = await testtarget.getSuffix(denops);
    assertEquals(context.lines.length, 3);
    assertEquals(context.lines[0], "foo");
    assertEquals(context.lines[1], "bar");
    assertEquals(context.lines[2], "qux");
  },
});

test({
  mode: "all",
  name:
    "getSuffix should return second and third line when the cursor at the 1,0",
  fn: async (denops) => {
    await fn.setbufline(denops, 1, 1, ["foo", "bar", "qux"]);
    await denops.cmd(`normal! gg0j`);

    const context = await testtarget.getSuffix(denops);
    assertEquals(context.lines.length, 2);
    assertEquals(context.lines[0], "bar");
    assertEquals(context.lines[1], "qux");
  },
});

test({
  mode: "all",
  name:
    "getSuffix should return fragment of the line when the cursor at middle of the line",
  fn: async (denops) => {
    await fn.setbufline(denops, 1, 1, ["foo", "bar", "qux"]);
    await denops.cmd(`normal! gg0jll`);

    const context = await testtarget.getSuffix(denops);
    assertEquals(context.lines.length, 2);
    assertEquals(context.lines[0], "r");
    assertEquals(context.lines[1], "qux");
  },
});

test({
  mode: "all",
  name:
    "getSuffix should return empty when the cursor at the end of the buffer",
  fn: async (denops) => {
    await fn.setbufline(denops, 1, 1, ["foo", "bar", "qux"]);
    await denops.cmd(`normal! G$`);

    const context = await testtarget.getSuffix(denops);
    assertEquals(context.lines.length, 1);
    assertEquals(context.lines[0], "x");
  },
});
