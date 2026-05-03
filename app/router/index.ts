import { createChannel, listChannels } from "./chanel";
import { createWorkspace, listWorkspace } from "./workspace";
export const router = {
  workspace: {
    list: listWorkspace,
    create: createWorkspace,
  },

  channel: {
    create: createChannel,
    list: listChannels,
  },
};
