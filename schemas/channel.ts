import z from "zod";

export function transformChannelName(name: string) {
  return name
    .toLocaleLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export const ChannelNameSchema = z.object({
  name: z
    .string()
    .min(2, "Channel name must be at least 2 characters")
    .max(50, "Channel name must be at most 50 characters")
    .transform((name, ctx) => {
      const transform = transformChannelName(name);
      if (transform.length < 2) {
        ctx.addIssue({
          code: "custom",
          message:
            "Channel name must contain at least 2 characters after transformation",
        });

        return z.NEVER;
      }

      return transform;
    }),
});

export type ChannelSchemaNameType = z.infer<typeof ChannelNameSchema>;
