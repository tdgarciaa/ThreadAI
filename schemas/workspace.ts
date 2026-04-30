import { z } from "zod";
export const workspaceSchema = z.object({
  name: z.string().min(2).max(15),
});

export type WorkspaceSchemaType = z.infer<typeof workspaceSchema>;
