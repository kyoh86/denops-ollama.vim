import { Denops } from "jsr:@denops/core@6.1.0";
import { ensure, is, maybe } from "jsr:@core/unknownutil@3.18.1";
import { bindDispatcher } from "jsr:@kyoh86/denops-bind-params@0.0.1-alpha.2";

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
import { isOpenLogArgs, openLog } from "./dispatch/open_log.ts";

export async function main(denops: Denops) {
  const { cacheFile } = await init(denops);

  denops.dispatcher = bindDispatcher({
    async open_log(uParams: unknown) {
      await openLog(denops, cacheFile, ensure(uParams, isOpenLogArgs));
    },

    async start_chat(uParams: unknown) {
      await startChat(denops, ensure(uParams, isStartChatArgs));
    },

    async start_chat_in_ctx(uParams: unknown) {
      await startChatInCtx(denops, ensure(uParams, isStartChatInCtxArgs));
    },

    async complete(uParams: unknown) {
      const params = ensure(uParams, isCompleteArgs);
      const callbackName = maybe(params.callback, is.String);
      const callbackFunc = maybe(params.callback, is.AsyncFunction);
      const callback = callbackFunc ?? (async (msg: string) => {
        await denops.call("denops#callback#call", callbackName, msg);
      });

      await complete(denops, { ...params, callback });
    },

    async list_models(uParams: unknown) {
      await listModels(denops, ensure(uParams, isListModelsArgs));
    },

    async pull_model(uParams: unknown) {
      await pullModel(denops, ensure(uParams, isPullModelArgs));
    },

    async delete_model(uParams: unknown) {
      await deleteModel(denops, ensure(uParams, isDeleteModelArgs));
    },
  });
}
