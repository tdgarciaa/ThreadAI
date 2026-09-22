"use client";

import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { createMessageSchema } from "@/schemas/message";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateMessageSchemaType } from "@/schemas/message";
import { MessageComposer } from "../message/MessageComposer";
import { Controller, useForm } from "react-hook-form";
import { useParams } from "next/navigation";
import { useAttachmentUpload } from "@/hooks/use-attachment-upload";
import { useEffect, useState } from "react";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { toast } from "sonner";

import type { KindeUser } from "@kinde-oss/kinde-auth-nextjs/types";
import { getAvatar } from "@/lib/get-avatar";
import { MessageListItem } from "@/lib/types";
import { useChannelRealTime } from "@/providers/ChannelRealtimeProvider";
import { useThreadRealtime } from "@/providers/ThreadRealtimeProvider";
import { data } from "motion/react-m";
import { da } from "zod/v4/locales";

interface ThreadReplyProps {
  threadId: string;
  user: KindeUser<Record<string, unknown>>;
}

export function ThreadReplyForm({ threadId, user }: ThreadReplyProps) {
  const { channelId } = useParams<{ channelId: string }>();
  const upload = useAttachmentUpload();
  const [editorKey, setEditorKey] = useState(0);
  const queryClient = useQueryClient();
  const { send } = useChannelRealTime();

  const { send: sendThread } = useThreadRealtime();
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const form = useForm<CreateMessageSchemaType>({
    resolver: zodResolver(createMessageSchema),
    defaultValues: {
      channelId: channelId,
      content: "",
      threadId: threadId,
    },
  });

  useEffect(() => {
    form.setValue("threadId", threadId);
  }, [threadId, form]);

  const createMessageMutation = useMutation(
    orpc.message.create.mutationOptions({
      onMutate: async (data) => {
        const listOptions = orpc.message.thread.list.queryOptions({
          input: {
            messageId: threadId,
          },
        });

        type MessagePage = {
          items: Array<MessageListItem>;
          nextCursor?: string;
        };

        type InfiniteMessages = InfiniteData<MessagePage>;

        type ThreadMessages = {
          parent: MessageListItem;
          messages: MessageListItem[];
        };

        await queryClient.cancelQueries({ queryKey: listOptions.queryKey });

        const previousData = await queryClient.getQueryData(
          listOptions.queryKey,
        );

        const optimistic: MessageListItem = {
          id: `optimistic-${crypto.randomUUID()}`,
          workspaceId: workspaceId,
          content: data.content,
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: user.id,
          authorEmail: user.email!,
          authorAvatar: getAvatar(user.picture, user.email!),
          authorName: user.given_name ?? "Jhon Doe",
          channelId: data.channelId,
          threadId: data.threadId!,
          createdById: user.id,
          imageUrl: data.imageUrl ?? null,
          replyCount: 0,
          reactions: [],
        };
        queryClient.setQueryData<ThreadMessages>(
          listOptions.queryKey,
          (old) => {
            if (!old) return old;

            return {
              ...old,
              messages: [...old.messages, optimistic],
            };
          },
        );

        {
          /* Optimistically updates the replies count in the main section**/
        }

        queryClient.setQueryData<InfiniteMessages>(
          ["message.list", channelId],
          (old) => {
            if (!old) return old;

            const pages = old.pages.map((page) => ({
              ...page,
              items: page.items.map((m) =>
                m.id === threadId ? { ...m, replyCount: m.replyCount + 1 } : m,
              ),
            }));

            return {
              ...old,
              pages,
            };
          },
        );
        return {
          listOptions,
          previousData,
        };
      },

      onSuccess: (data, _variables, context) => {
        queryClient.invalidateQueries({
          queryKey: context.listOptions.queryKey,
        });

        form.reset({ channelId, content: "", threadId });
        upload.clear();
        setEditorKey((k) => k + 1);

        sendThread({
          type: "thread:reply:created",
          payload: { reply: data },
        });

        send({
          type: "message:replies:increment",
          payload: { messageId: threadId, delta: 1 },
        });
        return toast.success("Message created succesfully");
      },
      onError: (_error, _variables, context) => {
        if (!context) return;

        const { listOptions, previousData } = context;

        if (previousData) {
          queryClient.setQueryData(listOptions.queryKey, previousData);
        }

        return toast.error("Something went wrong");
      },
    }),
  );

  function onSubmit(data: CreateMessageSchemaType) {
    createMessageMutation.mutate({
      ...data,
      imageUrl: upload.stagedUrl ?? undefined,
    });
  }
  return (
    <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Controller
          name="content"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="message-content">Message</FieldLabel>

              <MessageComposer
                key={editorKey}
                value={field.value}
                onChange={field.onChange}
                onSubmit={() => onSubmit(form.getValues())}
                upload={upload}
                isSubmiting={createMessageMutation.isPending}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
}
