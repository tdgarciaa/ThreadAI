import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { orpc } from "@/lib/orpc";

import {
  CreateMessageSchemaType,
  updateMessageSchema,
  UpdateMessageSchemaType,
} from "@/schemas/message";

import { toast } from "sonner";

import { MessageComposer } from "../message/MessageComposer";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Message } from "@/generated/prisma/browser";
import { UpdateMessage } from "next/dist/build/swc/types";
import {
  InfiniteData,
  QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

interface EditMessageProps {
  message: Message;
  onCancel: () => void;
  onSave: () => void;
}

export function EditMessage({ message, onCancel, onSave }: EditMessageProps) {
  const queryClient = useQueryClient();
  const form = useForm({
    resolver: zodResolver(updateMessageSchema),
    defaultValues: {
      messageId: message.id,
      content: message.content,
    },
  });

  const updateMutation = useMutation(
    orpc.message.update.mutationOptions({
      onSuccess: (updated) => {
        type MessagePage = { items: Message[]; nextCursor?: string };
        type infiniteMessages = InfiniteData<MessagePage>;
        queryClient.setQueryData<infiniteMessages>(
          ["message.list", message.channelId],
          (old) => {
            if (!old) return old;

            const updatedMessages = updated.message;
            const pages = old.pages.map((page) => ({
              ...page,
              items: page.items.map((m) =>
                m.id === updatedMessages.id ? { ...m, ...updatedMessages } : m,
              ),
            }));
            return {
              ...old,
              pages,
            };
          },
        );
        toast.success("Message Updated succesfully");
        onSave();
      },
    }),
  );

  function onSubmit(data: UpdateMessageSchemaType) {
    updateMutation.mutate(data);
  }

  return (
    <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Controller
          name="content"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <RichTextEditor
                field={field}
                sendButton={
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={onCancel}
                      disabled={updateMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={updateMutation.isPending}
                      type="submit"
                      size="sm"
                    >
                      {updateMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                }
              />
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
}
