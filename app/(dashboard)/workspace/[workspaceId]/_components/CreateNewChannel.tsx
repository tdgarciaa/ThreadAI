"use client";

import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  ChannelNameSchema,
  ChannelSchemaNameType,
  transformChannelName,
} from "@/schemas/channel";
import { Controller } from "react-hook-form";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { toast } from "sonner";
import { isDefinedError } from "@orpc/client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

type FormValues = z.infer<typeof ChannelNameSchema>;

export function CreateNewChannel() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const form = useForm<FormValues>({
    resolver: zodResolver(ChannelNameSchema),
    defaultValues: {
      name: "",
    },
  });

  const createChannelMutation = useMutation(
    orpc.channel.create.mutationOptions({
      onSuccess: (newChannel) => {
        toast.success(`Channel ${newChannel.name} created successfully`);

        queryClient.invalidateQueries({
          queryKey: orpc.channel.list.queryKey(),
        });
        form.reset();
        setOpen(false);
        router.push(`/workspace/${workspaceId}/channel/${newChannel.id}`);
      },
      onError: (error) => {
        if (isDefinedError(error)) {
          toast.error(error.message);
          return;
        }

        toast.error("Failed to create channel, please try later");
      },
    }),
  );

  function onSubmit(values: ChannelSchemaNameType) {
    createChannelMutation.mutate(values);
  }

  const watchedName = form.watch("name");
  const transformedName = watchedName ? transformChannelName(watchedName) : "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild className="rounded-lg">
        <Button variant="outline" className="w-full">
          <Plus className="size-4" />
          Add channel
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-lg">
        <DialogHeader>
          <DialogTitle>Create channel</DialogTitle>
          <DialogDescription>
            Create a new Channel to get started
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-title">Name</FieldLabel>

                  <Input
                    {...field}
                    id="form-rhf-demo-title"
                    aria-invalid={fieldState.invalid}
                    placeholder="My channel"
                    autoComplete="off"
                    className="rounded-lg"
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                  {transformedName && transformedName !== watchedName && (
                    <p className="text-sm text-muted-foreground ">
                      Will be created as:{" "}
                      <code className="bg-muted px-1 py-0.5 rounded text-sm">
                        {transformedName}
                      </code>
                    </p>
                  )}
                </Field>
              )}
            />
            <Button
              disabled={createChannelMutation.isPending}
              type="submit"
              className="w-full rounded-lg"
            >
              {createChannelMutation.isPending
                ? "Creating..."
                : "Create new channel"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
