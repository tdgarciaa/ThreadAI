import { createChannel, listChannels, getChannel } from "./chanel";
import {
  createMessage,
  listMessages,
  updateMessage,
  listThreadReply,
  toggleReaction,
} from "./message";
import { createWorkspace, listWorkspace } from "./workspace";
import { inviteMember, listMembers } from "./member";
import { generateThreadSummary } from "./ai";
export const router = {
  workspace: {
    list: listWorkspace,
    create: createWorkspace,
    member: {
      list: listMembers,
      invite: inviteMember,
    },
  },
  channel: {
    create: createChannel,
    list: listChannels,
    get: getChannel,
  },
  message: {
    create: createMessage,
    list: listMessages,
    update: updateMessage,
    reaction: {
      toggle: toggleReaction,
    },
    thread: {
      list: listThreadReply,
    },
  },

  ai: {
    // compose: {
    //   generate: {},
    // },
    thread: {
      summary: {
        generate: generateThreadSummary,
      },
    },
  },
};
