import React, { ReactNode, Suspense } from "react";
import { WorkspaceHeader } from "./_components/WorkspaceHeader";
import { CreateNewChannel } from "./_components/CreateNewChannel";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronUp, ChevronDown } from "lucide-react";
import { ChannelList } from "./_components/ChannelList";
import { WorkspaceMembersList } from "./_components/WorkspaceMembersList";
import { getQueryClient, HydrateClient } from "@/lib/query/hydration";
import { orpc } from "@/lib/orpc";

async function ChannelListLayout({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(orpc.channel.list.queryOptions());
  return (
    <div className="flex h-full flex-1">
      <div className="flex h-full w-80 flex-col bg-secondary border-r border-border">
        <HydrateClient client={queryClient}>
          {/*Header */}
          <div className="flex items-center px-4 h-14 border-b border-border">
            <Suspense fallback={null}>
              <WorkspaceHeader />
            </Suspense>
          </div>
          <div className="px-4  py-4">
            <CreateNewChannel />
          </div>
          {/*Channel div */}
          <div className="px-4 py-2">
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1 text-sm font-medium text-muted-foreground hover:text-accent-foreground">
                Main
                <ChevronDown className="size-4 transition-transform duration-200" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Suspense fallback={null}>
                  <ChannelList />
                </Suspense>
              </CollapsibleContent>
            </Collapsible>
          </div>
          {/*Members div */}
          <div className="mt-auto px-4 py-2 border-t border-border">
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1 text-sm font-medium text-muted-foreground hover:text-accent-foreground [&[data-state=open]>svg]:rotate-180">
                Members
                <ChevronUp className="size-4 transition-transform duration-200" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Suspense fallback={null}>
                  <WorkspaceMembersList />
                </Suspense>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </HydrateClient>
      </div>
      <div className="min-w-0 flex flex-1">{children}</div>
    </div>
  );
}

export default ChannelListLayout;
