import { abortable } from "jsr:@std/async@~1.0.1";
import type { Denops } from "jsr:@denops/std@~7.3.0";
import {
  as,
  is,
  maybe,
  type PredicateType,
} from "jsr:@core/unknownutil@~4.3.0";

import { isOpener } from "../ui/open.ts";
import { ChatBase } from "../ui/chat.ts";
import { generateCompletion } from "../api.ts";
import { isReqArgs } from "./types.ts";

export const isStartChatArgs = is.IntersectionOf([
  is.ObjectOf({
    model: is.String,
    opener: as.Optional(isOpener),
    message: as.Optional(is.String),
    // A list of base64-encoded images (for multimodal models such as llava)
    images: as.Optional(is.ArrayOf(is.String)),
    // Additional model parameters listed in the documentation for the Modelfile such as temperature
    options: as.Optional(is.Record),
    // System message to (overrides what is defined in the Modelfile)
    system: as.Optional(is.String),
  }),
  isReqArgs,
]);

export type StartChatArgs = PredicateType<typeof isStartChatArgs>;

class Chat extends ChatBase<number[]> {
  constructor(private args: StartChatArgs) {
    super(args.model, args.timeout, undefined, args.message);
  }

  parseContext(context: unknown): number[] | undefined {
    return maybe(context, is.ArrayOf(is.Number));
  }

  async process(
    denops: Denops,
    bufnr: number,
    context: number[] | undefined,
    signal: AbortSignal,
    prompt: string,
  ): Promise<void> {
    const result = await generateCompletion(
      this.model,
      prompt,
      {
        images: this.args.images,
        options: this.args.options,
        system: this.args.system,
        context,
      },
      { baseUrl: this.args.baseUrl, signal },
    );
    if (!result.body) {
      return;
    }
    for await (
      const item of abortable(result.body.values(), signal)
    ) {
      if ("error" in item) throw new Error(item.error);

      // memory completion context
      if (item.context) {
        await this.setContext(denops, bufnr, item.context);
      }

      // put response to buffer
      await this.echo(denops, bufnr, item.response);
    }
  }
}

export async function startChat(denops: Denops, args: StartChatArgs) {
  const chat = new Chat(args);
  await chat.start(denops, args?.opener);
}
