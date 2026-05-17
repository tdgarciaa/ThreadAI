"use client";

import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMessageSchema } from "@/schemas/message";
import { MessageComposer } from "./MessageComposer";
import {
  QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { CreateMessageSchemaType } from "@/schemas/message";
import { toast } from "sonner";
import { useState } from "react";
import { useAttachmentUpload } from "@/hooks/use-attachment-upload";
import type { Message } from "@/generated/prisma/browser";
import type { KindeUser } from "@kinde-oss/kinde-auth-nextjs";

import type { InfiniteData } from "@tanstack/react-query";
import { getAvatar } from "@/lib/get-avatar";

interface AppProps {
  channelId: string;
  user: KindeUser<Record<string, unknown>>;
}

type MessagePage = {
  items: Message[];
  nextCursor?: string;
};

type InfiniteMessages = InfiniteData<MessagePage>;

export function MessageInputForm({ channelId, user }: AppProps) {
  const queryClient = useQueryClient();
  const [editorKey, setEditorKey] = useState(0);
  const upload = useAttachmentUpload();
  const form = useForm<CreateMessageSchemaType>({
    resolver: zodResolver(createMessageSchema),
    defaultValues: {
      channelId: channelId,
      content: "",
    },
  });

  const createMessageMutation = useMutation(
    orpc.message.create.mutationOptions({
      onMutate: async (data) => {
        await queryClient.cancelQueries({
          queryKey: ["message.list", channelId],
        });
        const previousData = queryClient.getQueryData<InfiniteMessages>([
          "message.list",
          channelId,
        ]);

        const tempId = `optimistic-${crypto.randomUUID()}`;

        const optimisticMessage: Message = {
          id: tempId,
          channelId: channelId,
          workspaceId: "",
          content: data.content,
          imageUrl: data.imageUrl ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: user.id,
          authorAvatar: getAvatar(user.picture, user.email!),
          authorEmail: user.email!,
          authorName: user.email ?? "Jhon Doe",
          createdById: "",
        };

        queryClient.setQueryData<InfiniteMessages>(
          ["message.list", channelId],
          (old) => {
            if (!old) {
              return {
                pages: [
                  {
                    items: [optimisticMessage],
                    nextCursor: undefined,
                  },
                ],
                pageParams: [undefined],
              } satisfies InfiniteMessages;
            }

            const firstPage = old.pages[0] ?? {
              items: [],
              nextCursor: undefined,
            };

            const updatedFirstPage: MessagePage = {
              ...firstPage,
              items: [optimisticMessage, ...firstPage.items],
            };

            return {
              ...old,
              pages: [updatedFirstPage, ...old.pages.slice(1)],
            };
          },
        );

        return {
          previousData,
          tempId,
        };
      },

      onSuccess: (data, _variables, context) => {
        queryClient.setQueryData<InfiniteMessages>(
          ["message.list", channelId],
          (old) => {
            if (!old) return old;

            const updatedPages = old.pages.map((page) => ({
              ...page,
              items: page.items.map((m) =>
                m.id === context.tempId
                  ? {
                      ...data,
                    }
                  : m,
              ),
            }));

            return { ...old, pages: updatedPages };
          },
        );

        form.reset({ channelId, content: "" });
        (upload.clear, setEditorKey((k) => k + 1));
        return toast.success("Message created succesfully");
      },

      onError: (_error, _variables, context) => {
        if (context?.previousData) {
          queryClient.setQueryData(
            ["messag e.list", channelId],
            context.previousData,
          );
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
                isSubmiting={createMessageMutation.isPending}
                upload={upload}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
}
