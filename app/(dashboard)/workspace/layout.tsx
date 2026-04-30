import React, { ReactNode } from "react";
import { WorkSpaceList } from "./_components/WorkspaceList";
import { CreateWorkspace } from "./_components/CreateWorkspace";
import { UserNav } from "./_components/UserNav";
import { getQueryClient } from "@/lib/query/hydration";
import { orpc } from "@/lib/orpc";
import { HydrateClient } from "@/lib/query/hydration";

const WorkspaceLayout = async ({ children }: { children: ReactNode }) => {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(orpc.workspace.list.queryOptions());
  return (
    <div className="flex w-full h-screen">
      <div className="flex h-full w-20 flex-col items-center bg-secondary py-3 px-2 border-r border-border">
        <HydrateClient client={queryClient}>
          <WorkSpaceList />
        </HydrateClient>
        <div>
          <CreateWorkspace />
        </div>
        <div className="mt-auto">
          <HydrateClient client={queryClient}>
            <UserNav />
          </HydrateClient>
        </div>
      </div>
      {children}
    </div>
  );
};

export default WorkspaceLayout;
