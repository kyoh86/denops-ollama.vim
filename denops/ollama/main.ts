import { Denops } from "https://deno.land/x/denops_std@v6.0.1/mod.ts";
import { ensure, is } from "https://deno.land/x/unknownutil@v3.15.0/mod.ts";

import init from "./dispatch/init.ts";
import startChat, {
  isGenerateCompletionParams,
  isOpener,
  isStartChatOpts,
} from "./dispatch/start_chat.ts";
import listModels, { isListModelsOpts } from "./dispatch/list_models.ts";
import pullModel, {
  isPullModelOpts,
  isPullModelParams,
} from "./dispatch/pull_model.ts";
import deleteModel, {
  isDeleteModelOpts,
  isDeleteModelParams,
} from "./dispatch/delete_model.ts";
import {
  isChatContext,
  isGenerateChatCompletionParams,
  isStartChatWithContextOpts,
  startChatWithContext,
} from "./dispatch/start_chat_with_context.ts";
import complete, { isCompleteOpts } from "./dispatch/complete.ts";

export async function main(denops: Denops) {
  const { cacheFile } = await init(denops);

  denops.dispatcher = {
    async openLog(uOpts: unknown) {
      const opts = ensure(
        uOpts,
        is.OneOf([
          is.Undefined,
          is.ObjectOf({
            opener: is.OptionalOf(isOpener),
          }),
        ]),
      );
      await denops.cmd(`${opts?.opener ?? "tabnew"} ${cacheFile}`);
    },

    async startChat(
      uModel: unknown,
      uOpts: unknown,
      uParams: unknown,
    ) {
      await startChat(
        denops,
        ensure(uModel, is.String),
        ensure(uOpts, is.OneOf([is.Undefined, isStartChatOpts])),
        ensure(uParams, is.OneOf([is.Undefined, isGenerateCompletionParams])),
      );
    },

    async complete(
      uModel: unknown,
      uCallback: unknown,
      uOpts: unknown,
      uParams: unknown,
    ) {
      await complete(
        denops,
        ensure(uModel, is.String),
        async (msg: string) => {
          await denops.call(
            "denops#callback#call",
            ensure(uCallback, is.String),
            msg,
          );
        },
        ensure(uOpts, is.OneOf([is.Undefined, isCompleteOpts])),
        ensure(uParams, is.OneOf([is.Undefined, isGenerateCompletionParams])),
      );
    },

    async startChatWithContext(
      uModel: unknown,
      uContext: unknown,
      uOpts: unknown,
      uParams: unknown,
    ) {
      await startChatWithContext(
        denops,
        ensure(uModel, is.String),
        ensure(uContext, isChatContext),
        ensure(uOpts, is.OneOf([is.Undefined, isStartChatWithContextOpts])),
        ensure(
          uParams,
          is.OneOf([is.Undefined, isGenerateChatCompletionParams]),
        ),
      );
    },

    async listModels(uOpts: unknown) {
      await listModels(
        denops,
        ensure(uOpts, is.OneOf([is.Undefined, isListModelsOpts])),
      );
    },

    async pullModel(
      uName: unknown,
      uOpts: unknown,
      uParams: unknown,
    ) {
      await pullModel(
        denops,
        ensure(uName, is.String),
        ensure(uOpts, is.OneOf([is.Undefined, isPullModelOpts])),
        ensure(uParams, is.OneOf([is.Undefined, isPullModelParams])),
      );
    },

    async deleteModel(uName: unknown, uOpts: unknown, uParams: unknown) {
      await deleteModel(
        denops,
        ensure(uName, is.String),
        ensure(uOpts, is.OneOf([is.Undefined, isDeleteModelOpts])),
        ensure(uParams, is.OneOf([is.Undefined, isDeleteModelParams])),
      );
    },
  };
}
