import { Denops } from "https://deno.land/x/denops_std@v6.0.1/mod.ts";
import { ensure, is } from "https://deno.land/x/unknownutil@v3.15.0/mod.ts";

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
import { isOpener } from "./ui/open.ts";

export async function main(denops: Denops) {
  const { cacheFile } = await init(denops);

  denops.dispatcher = {
    async openLog(uArgs: unknown) {
      const args = ensure(
        uArgs,
        is.ObjectOf({
          opener: is.OptionalOf(isOpener),
        }),
      );
      await denops.cmd(`${args?.opener ?? "tabnew"} ${cacheFile}`);
    },

    async startChat(uArgs: unknown) {
      await startChat(denops, ensure(uArgs, isStartChatArgs));
    },

    async startChatWithContext(uArgs: unknown) {
      await startChatWithContext(
        denops,
        ensure(uArgs, isStartChatWithContextArgs),
      );
    },

    async complete(uArgs: unknown) {
      const args = ensure(uArgs, isCompleteArgs);
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
      await listModels(denops, ensure(uArgs, isListModelsArgs));
    },

    async pullModel(uArgs: unknown) {
      await pullModel(denops, ensure(uArgs, isPullModelArgs));
    },

    async deleteModel(uArgs: unknown) {
      await deleteModel(denops, ensure(uArgs, isDeleteModelArgs));
    },
  };
}
