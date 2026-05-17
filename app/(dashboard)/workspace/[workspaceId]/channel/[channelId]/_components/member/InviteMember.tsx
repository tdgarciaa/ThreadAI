import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogHeader,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { inviteMemberSchema, InviteMembersSchemaType } from "@/schemas/members";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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

export default function InviteMember() {
  const [open, setOpen] = useState(false);

  type FormValues = z.infer<typeof inviteMemberSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      name: "",
    },
  });

  const inviteMutation = useMutation(
    orpc.workspace.member.invite.mutationOptions({
      onSuccess: () => {
        toast.success("Invitation sent succesfully");
        form.reset();
        setOpen(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  function onSubmit(values: InviteMembersSchemaType) {
    inviteMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={"outline"}>
          <UserPlus />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm-max:-w-[425]px">
        <DialogHeader>
          <DialogTitle>Invite Memeber</DialogTitle>
          <DialogDescription>
            Invite a new memeber to your workspace by using their email
          </DialogDescription>
        </DialogHeader>

        <form id="form-invite-members" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-invite-members">Name</FieldLabel>

                  <Input
                    {...field}
                    id="form-invite-members"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter the name..."
                    autoComplete="off"
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-invite-members">Email</FieldLabel>

                  <Input
                    {...field}
                    id="form-invite-members"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter Email address..."
                    autoComplete="off"
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Button>Send</Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
