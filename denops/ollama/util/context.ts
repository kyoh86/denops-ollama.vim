// Functions to get message from context

import { type Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v5.2.0/function/mod.ts";
import * as option from "https://deno.land/x/denops_std@v5.2.0/option/mod.ts";
import {
  is,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.14.0/mod.ts";

export const isBufferInfo = is.OneOf([
  is.String,
  is.Number,
  is.ObjectOf({
    bufnr: is.Number,
    name: is.String,
  }),
]);
export type BufferInfo = PredicateType<typeof isBufferInfo>;

export async function getCurrentBuffer(denops: Denops) {
  const bufnr = await fn.bufnr(denops, "");
  return getBuffer(denops, bufnr);
}

export async function getBuffer(denops: Denops, buf: BufferInfo) {
  if (typeof buf === "number") {
    const name = await fn.bufname(denops, buf);
    return {
      name,
      bufnr: buf,
      content: (await fn.getbufline(denops, buf, 1, "$")).join("\n"),
    };
  }
  if (typeof buf === "string") {
    const bufnr = await fn.bufnr(denops, buf);
    return {
      name: buf,
      bufnr,
      content: (await fn.getbufline(denops, buf, 1, "$")).join("\n"),
    };
  }
  return {
    ...buf,
    content: (await fn.getbufline(denops, buf.bufnr, 1, "$")).join("\n"),
  };
}

export async function getVisualSelection(denops: Denops) {
  // Why is this not a built-in Vim script function?!
  const [, line_start, column_start] = await fn.getpos(denops, "'<");
  const [, line_end, column_end] = await fn.getpos(denops, "'>");

  const lines = await fn.getline(denops, line_start, line_end);
  if (lines.length == 0) {
    return "";
  }
  const selection = await option.selection.get(denops);
  lines[lines.length - 1] = lines[-1].substring(
    0,
    column_end - (selection === "inclusive" ? 1 : 2),
  );

  lines[0] = lines[0].substring(column_start - 1);
  return lines.join("\n");
}
