import { Denops } from "https://deno.land/x/denops_std@v6.0.1/mod.ts";
import { ensure, is } from "https://deno.land/x/unknownutil@v3.15.0/mod.ts";

import { init } from "./dispatch/init.ts";
import {
  isGenerateCompletionParams,
  isStartChatOpts,
  startChat,
} from "./dispatch/start_chat.ts";
import { isListModelsOpts, listModels } from "./dispatch/list_models.ts";
import {
  isPullModelOpts,
  isPullModelParams,
  pullModel,
} from "./dispatch/pull_model.ts";
import {
  deleteModel,
  isDeleteModelOpts,
  isDeleteModelParams,
} from "./dispatch/delete_model.ts";
import {
  isGenerateChatCompletionParams,
  isStartChatWithContextOpts,
  startChatWithContext,
} from "./dispatch/start_chat_with_context.ts";
import { complete, isCompleteOpts } from "./dispatch/complete.ts";
import { isOpener } from "./ui/open.ts";

export async function main(denops: Denops) {
  const { cacheFile } = await init(denops);

  denops.dispatcher = {
    async openLog(uOpts: unknown) {
      const opts = ensure(
        uOpts,
        is.ObjectOf({
          opener: is.OptionalOf(isOpener),
        }),
      );
      await denops.cmd(`${opts?.opener ?? "tabnew"} ${cacheFile}`);
    },

    async startChat(uOpts: unknown, uParams: unknown) {
      await startChat(
        denops,
        ensure(uOpts, isStartChatOpts),
        ensure(uParams, is.OptionalOf(isGenerateCompletionParams)),
      );
    },

    async startChatWithContext(uOpts: unknown, uParams: unknown) {
      await startChatWithContext(
        denops,
        ensure(uOpts, isStartChatWithContextOpts),
        ensure(uParams, is.OptionalOf(isGenerateChatCompletionParams)),
      );
    },

    async complete(uOpts: unknown, uParams: unknown) {
      const args = ensure(uOpts, isCompleteOpts);
      await complete(
        denops,
        {
          ...args,
          callback: async (msg: string) => {
            await denops.call("denops#callback#call", args.callback, msg);
          },
        },
        ensure(uParams, is.OptionalOf(isGenerateCompletionParams)),
      );
    },

    async listModels(uOpts: unknown) {
      await listModels(denops, ensure(uOpts, isListModelsOpts));
    },

    async pullModel(uOpts: unknown, uParams: unknown) {
      await pullModel(
        denops,
        ensure(uOpts, isPullModelOpts),
        ensure(uParams, is.OptionalOf(isPullModelParams)),
      );
    },

    async deleteModel(uOpts: unknown, uParams: unknown) {
      await deleteModel(
        denops,
        ensure(uOpts, isDeleteModelOpts),
        ensure(uParams, is.OptionalOf(isDeleteModelParams)),
      );
    },
  };
}
