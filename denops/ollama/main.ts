import { Denops } from "https://deno.land/x/denops_std@v6.0.1/mod.ts";
import {
  ensure,
  Predicate,
} from "https://deno.land/x/unknownutil@v3.15.0/mod.ts";

import { init } from "./dispatch/init.ts";
import { isStartChatArgs, startChat } from "./dispatch/start_chat.ts";
import { isListModelsArgs, listModels } from "./dispatch/list_models.ts";
import { isPullModelArgs, pullModel } from "./dispatch/pull_model.ts";
import { deleteModel, isDeleteModelArgs } from "./dispatch/delete_model.ts";
import {
  isStartChatWithContextArgs,
  startChatWithContext,
} from "./dispatch/start_chat_with_context.ts";
import { complete, isCompleteArgs } from "./dispatch/complete.ts";
import { CustomArgStore, isArgs } from "./custom/arg_store.ts";
import { isOpenLogArgs, openLog } from "./dispatch/open_log.ts";

export async function main(denops: Denops) {
  const { cacheFile } = await init(denops);

  const argStore = new CustomArgStore();

  function getArgs<T>(func: string, uArgs: unknown, pred: Predicate<T>): T {
    return ensure(argStore.getMerged(func, ensure(uArgs, isArgs)), pred);
  }

  denops.dispatcher = {
    async openLog(uArgs: unknown) {
      const args = getArgs("openLog", uArgs, isOpenLogArgs);
      await openLog(denops, cacheFile, args);
    },

    async startChat(uArgs: unknown) {
      const args = getArgs("startChat", uArgs, isStartChatArgs);
      await startChat(denops, args);
    },

    async startChatWithContext(uArgs: unknown) {
      const args = getArgs(
        "startChatWithContext",
        uArgs,
        isStartChatWithContextArgs,
      );
      await startChatWithContext(denops, args);
    },

    async complete(uArgs: unknown) {
      const args = getArgs("complete", uArgs, isCompleteArgs);
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
      const args = getArgs("listModels", uArgs, isListModelsArgs);
      await listModels(denops, args);
    },

    async pullModel(uArgs: unknown) {
      const args = getArgs("pullModel", uArgs, isPullModelArgs);
      await pullModel(denops, args);
    },

    async deleteModel(uArgs: unknown) {
      const args = getArgs("deleteModel", uArgs, isDeleteModelArgs);
      await deleteModel(denops, args);
    },
  };
}
