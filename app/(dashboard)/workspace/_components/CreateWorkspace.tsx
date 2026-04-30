"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  TooltipTrigger,
  Tooltip,
  TooltipProvider,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { workspaceSchema, WorkspaceSchemaType } from "@/schemas/workspace";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { useQueryClient } from "@tanstack/react-query";
import { isDefinedError } from "@orpc/client";

type FormValues = z.infer<typeof workspaceSchema>;

export function CreateWorkspace() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
    },
  });

  const createWorkspaceMutation = useMutation(
    orpc.workspace.create.mutationOptions({
      onSuccess: (newWorkspace) => {
        toast.success(
          `Workspace ${newWorkspace.workspaceName} created succesfully`,
        );

        queryClient.invalidateQueries({
          queryKey: orpc.workspace.list.queryKey(),
        });

        form.reset();
        setOpen(false);
      },
      onError: (error) => {
        if (isDefinedError(error)) {
          if (error.code === "RATE_LIMITED") {
            toast.error(error.message);
          }
          toast.error(error.message);
          return;
        }
        toast.error("Failed to create workspace, try again later");
      },
    }),
  );

  function onSubmit(values: WorkspaceSchemaType) {
    createWorkspaceMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-10 rounded-4xl border-2 border-dashed border-muted-foreground/50 text-muted-foreground transition-all duration-200 hover:rounded-lg hover:border-muted-foreground hover:text-foreground"
              >
                <Plus className="size-5" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>

          <TooltipContent side="right">
            <p>Create workspace</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace to get started.
          </DialogDescription>
        </DialogHeader>
        <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
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
                    placeholder="My workspace"
                    autoComplete="off"
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Button
              disabled={createWorkspaceMutation.isPending}
              type="submit"
              className="w-full"
            >
              {createWorkspaceMutation.isPending
                ? "Creating ..."
                : "Create workspace"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
