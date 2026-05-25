import { client } from "@/lib/orpc";
import { redirect } from "next/navigation";
import {
  Empty,
  EmptyHeader,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
  EmptyContent,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Cloud } from "lucide-react";
import { CreateNewChannel } from "./_components/CreateNewChannel";

interface iAppProps {
  params: Promise<{ workspaceId: string }>;
}

const WorkspaceIdPage = async ({ params }: iAppProps) => {
  const { workspaceId } = await params;
  const { channels } = await client.channel.list();

  if (channels.length > 0) {
    return redirect(`/workspace/${workspaceId}/channel/${channels[0].id}`);
  }
  return (
    <div className="p-16  flex flex-1">
      <Empty className="border border-dashed bg-muted/30">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Cloud />
          </EmptyMedia>
          <EmptyTitle>Cloud Storage Empty</EmptyTitle>
          <EmptyDescription>
            Upload files to your cloud storage to access them anywhere.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="max-w-xs mx-auto">
          <CreateNewChannel />
        </EmptyContent>
      </Empty>
    </div>
  );
};

export default WorkspaceIdPage;
