import { MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ThreadReply } from "./ThreadReply";
import { ThreadReplyForm } from "./ThreadReplyForm";
import { useThread } from "@/providers/ThreadProviders";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { SaveContent } from "@/components/rich-text-editor/SaveContent";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs";

interface ThreadSideBarProps {
  user: KindeUser<Record<string, unknown>>;
}
export function ThreadSideBar({ user }: ThreadSideBarProps) {
  const { selectedThreadId, closeThread } = useThread();
  const { data, isLoading } = useQuery(
    orpc.message.thread.list.queryOptions({
      input: {
        messageId: selectedThreadId!,
      },
      //Solo hace fecth en caso de que selectedThred != false
      enabled: Boolean(selectedThreadId),
    }),
  );
  return (
    <div className="w-120 border-l flex flex-col h-full">
      {/** Header */}
      <div className="border-b h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4" />
          <span>Thread</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={"outline"} size="icon" onClick={() => closeThread()}>
            <X className="size-4" />
          </Button>
        </div>
      </div>
      {/** Main */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b bg-muted/20">
          {data && (
            <>
              <div className="flex space-x-3">
                <Image
                  src={data.parent.authorAvatar}
                  alt="Author image"
                  width={32}
                  height={32}
                  className="size-8 rounded-full"
                />
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">
                      {data.parent.authorName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("en-Us", {
                        hour: "numeric",
                        minute: "numeric",
                        hour12: true,
                        month: "short",
                        day: "numeric",
                      }).format(data.parent.createdAt)}
                    </span>
                  </div>
                  <SaveContent
                    className="text-sm wrap-break-word prose dark:prose-invert max-w-none"
                    content={JSON.parse(data.parent.content)}
                  />
                </div>
              </div>
            </>
          )}
        </div>
        {/**Thread replies */}
        <div className="p-2">
          <p className="text-xs text-muted-foreground mb-3 px-2">
            {data?.messages.length} replies
          </p>
          <div className="space-y-1">
            {data?.messages.map((reply) => (
              <ThreadReply key={reply.id} message={reply} />
            ))}
          </div>
        </div>
      </div>

      {/** Thread reply form */}
      <div className="border-t p-4">
        <ThreadReplyForm user={user} threadId={selectedThreadId!} />
      </div>
    </div>
  );
}
