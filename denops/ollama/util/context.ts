// Functions to get context

import { type Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import * as option from "https://deno.land/x/denops_std@v6.4.0/option/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import {
  ensure,
  is,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.17.2/mod.ts";

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

export async function getPrefix(denops: Denops) {
  const ret = { name: "", buf: 0, lines: [] as string[] };
  await batch.batch(denops, async () => {
    ret.name = await fn.bufname(denops);
    ret.buf = await fn.bufnr(denops);
    const [_, lnum, col] = await fn.getpos(denops, ".");
    ret.lines = await fn.getline(denops, 1, lnum);
    if (col == 1) {
      ret.lines.pop();
    } else {
      ret.lines[ret.lines.length - 1] =
        ret.lines[ret.lines.length - 1]?.substring(0, col - 1) ?? "";
    }
  });
  return ret;
}

export async function getSuffix(denops: Denops) {
  const ret = { name: "", buf: 0, lines: [] as string[] };
  await batch.batch(denops, async () => {
    ret.name = await fn.bufname(denops);
    ret.buf = await fn.bufnr(denops);
    const [_, lnum, col] = await fn.getpos(denops, ".");
    ret.lines = await fn.getline(denops, lnum, "$");
    ret.lines[0] = ret.lines[0]?.substring(col - 1) ?? "";
  });
  return ret;
}

const INT_MAX = 2147483647;
type Coord = [number, number];

/**
 * Get visual selection
 * Original is written in vimscript by haya14busa in MIT license.
 * See original: https://github.com/haya14busa/vim-asterisk/blob/master/autoload/asterisk.vim
 *
 * @return string: return visual selection
 */
export async function getVisualSelection(denops: Denops) {
  const mode = await fn.mode(denops, 1);
  const { curswant } = ensure(
    await fn.winsaveview(denops),
    is.ObjectOf({ curswant: is.Number }),
  );
  const end_col = curswant == INT_MAX
    ? INT_MAX
    : await getColInVisual(denops, ".");
  const current_pos: Coord = [await fn.line(denops, "."), end_col];
  const other_end_pos: Coord = [
    await fn.line(denops, "v"),
    await getColInVisual(denops, "v"),
  ];
  const [begin, end] = [current_pos, other_end_pos].sort(comparePos);
  if (await isExclusive(denops) && begin[1] !== end[1]) {
    // Decrement column number for :set selection=exclusive
    end[1] -= 1;
  }

  const suffix = mode === "V" ? "\n" : "";
  if (mode !== "V" && begin[0] === end[0] && begin[1] === end[1]) {
    return await getPosChar(denops, begin) + suffix;
  }

  if (mode === "\u0016") { // <C-v>
    const [min_c, max_c] = [begin[1], end[1]].sort();
    return (await Promise.all(
      [...Array(end[0] - begin[0] + 1)].map(async (_, i) => {
        const line = await fn.getline(denops, i + begin[0]);
        return line.substring(min_c - 1, max_c);
      }),
    )).join("\n") + suffix;
  }

  if (mode === "V") {
    return (await fn.getline(denops, begin[0], end[0])).join("\n") + suffix;
  }

  if (begin[0] === end[0]) {
    const line = await fn.getline(denops, begin[0]);
    return line.substring(begin[1] - 1, end[1]) + suffix;
  }

  return [
    (await fn.getline(denops, begin[0])).substring(begin[1] - 1),
    ...(end[0] - begin[0] < 2
      ? []
      : await fn.getline(denops, begin[0] + 1, end[0] - 1)),
    (await fn.getline(denops, end[0])).substring(0, end[1]),
  ].join("\n") + suffix;
}

function comparePos(x: Coord, y: Coord) {
  return Math.max(-1, Math.min(1, (x[0] == y[0]) ? x[1] - y[1] : x[0] - y[0]));
}

/** Get character at given position with multibyte handling
 * @param [Number, Number] as coordinate or expression for position :h line()
 * @return String
 */
async function getPosChar(denops: Denops, pos: Coord) {
  const [line, col] = pos;
  return await fn.matchstr(
    denops,
    await fn.getline(denops, line),
    ".",
    col - 1,
  );
}

async function isExclusive(denops: Denops) {
  return await option.selection.get(denops) === "exclusive";
}

/**
 * @return number: return multibyte aware column number in Visual mode to select
 */
async function getColInVisual(denops: Denops, p: string) {
  const [pos, other] = [p, p === "." ? "v" : "."];
  const c = await fn.col(denops, pos);
  const d =
    comparePos(await getCoord(denops, pos), await getCoord(denops, other)) > 0
      ? (await getPosChar(denops, [
        await fn.line(denops, pos),
        c - (await isExclusive(denops) ? 1 : 0),
      ])).length - 1
      : 0;
  return c + d;
}

async function getCoord(denops: Denops, expr: string): Promise<Coord> {
  const [_, l, c] = await fn.getpos(denops, expr);
  return [l, c];
}
