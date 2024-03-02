import { Denops } from "https://deno.land/x/denops_std@v6.2.0/mod.ts";
import {
  ensure,
  is,
  Predicate,
} from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

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
    async open_log(uArgs: unknown) {
      const args = ensureArgs("open_log", uArgs, isOpenLogArgs);
      await openLog(denops, cacheFile, args);
    },

    async start_chat(uArgs: unknown) {
      const args = ensureArgs("start_chat", uArgs, isStartChatArgs);
      await startChat(denops, args);
    },

    async start_chat_in_ctx(uArgs: unknown) {
      const args = ensureArgs(
        "start_chat_in_ctx",
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

    async list_models(uArgs: unknown) {
      const args = ensureArgs("list_models", uArgs, isListModelsArgs);
      await listModels(denops, args);
    },

    async pull_model(uArgs: unknown) {
      const args = ensureArgs("pull_model", uArgs, isPullModelArgs);
      await pullModel(denops, args);
    },

    async delete_model(uArgs: unknown) {
      const args = ensureArgs("delete_model", uArgs, isDeleteModelArgs);
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
