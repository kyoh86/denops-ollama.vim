import { Denops } from "https://deno.land/x/denops_std@v6.0.1/mod.ts";
import {
  ensure,
  is,
  Predicate,
} from "https://deno.land/x/unknownutil@v3.15.0/mod.ts";

import { init } from "./dispatch/init.ts";
import { isStartChatArgs, startChat } from "./dispatch/start_chat.ts";
import { isListModelsArgs, listModels } from "./dispatch/list_models.ts";
import { isPullModelArgs, pullModel } from "./dispatch/pull_model.ts";
import { deleteModel, isDeleteModelArgs } from "./dispatch/delete_model.ts";
import {
  isStartChatInCtxArgs,
  startChatInCtx,
} from "./dispatch/start_chat_in_ctx.ts";
import { complete, isCompleteArgs } from "./dispatch/complete.ts";
import { CustomArgStore, isArgs } from "./custom/arg_store.ts";
import { isOpenLogArgs, openLog } from "./dispatch/open_log.ts";

export async function main(denops: Denops) {
  const { cacheFile } = await init(denops);

  const argStore = new CustomArgStore();

  function ensureArgs<T>(func: string, uArgs: unknown, pred: Predicate<T>): T {
    return ensure(argStore.getArgs(func, ensure(uArgs, isArgs)), pred);
  }

  denops.dispatcher = {
    async openLog(uArgs: unknown) {
      const args = ensureArgs("openLog", uArgs, isOpenLogArgs);
      await openLog(denops, cacheFile, args);
    },

    async startChat(uArgs: unknown) {
      const args = ensureArgs("startChat", uArgs, isStartChatArgs);
      await startChat(denops, args);
    },

    async startChatInCtx(uArgs: unknown) {
      const args = ensureArgs(
        "startChatInCtx",
        uArgs,
        isStartChatInCtxArgs,
      );
      await startChatInCtx(denops, args);
    },

    async complete(uArgs: unknown) {
      const args = ensureArgs("complete", uArgs, isCompleteArgs);
      await complete(
        denops,
        {
          ...args,
          callback: async (msg: string) => {
            await denops.call("denops#callback#call", args.callback, msg);
          },
        },
      );
    },

    async listModels(uArgs: unknown) {
      const args = ensureArgs("listModels", uArgs, isListModelsArgs);
      await listModels(denops, args);
    },

    async pullModel(uArgs: unknown) {
      const args = ensureArgs("pullModel", uArgs, isPullModelArgs);
      await pullModel(denops, args);
    },

    async deleteModel(uArgs: unknown) {
      const args = ensureArgs("deleteModel", uArgs, isDeleteModelArgs);
      await deleteModel(denops, args);
    },

    customSetFuncArg(uFunc: unknown, uArg: unknown, value: unknown) {
      argStore.setFuncArg(
        ensure(uFunc, is.String),
        ensure(uArg, is.String),
        value,
      );
    },

    customPatchFuncArgs(uFunc: unknown, uArgs: unknown) {
      argStore.patchFuncArgs(
        ensure(uFunc, is.String),
        ensure(uArgs, is.RecordOf(isArgs)),
      );
    },

    customPatchArgs(uArgs: unknown) {
      argStore.patchArgs(ensure(uArgs, is.RecordOf(isArgs)));
    },
  };
}
