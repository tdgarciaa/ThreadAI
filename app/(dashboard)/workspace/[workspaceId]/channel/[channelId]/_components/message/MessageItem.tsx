import Image from "next/image";
import { getAvatar } from "@/lib/get-avatar";
import { SaveContent } from "@/components/rich-text-editor/SaveContent";
import { MessageHoverToolbar } from "../toolBar";
import { useCallback, useState } from "react";
import { EditMessage } from "../toolBar/EditMesage";
import type { MessageListItem } from "@/lib/types";
import { MessageSquareIcon } from "lucide-react";
import { useThread } from "@/providers/ThreadProviders";
import { orpc } from "@/lib/orpc";
import { useQueryClient } from "@tanstack/react-query";
import { ReactionsBar } from "../reaction/ReactionsBar";

interface iAppProps {
  message: MessageListItem;
  currentUserId: string;
}

function getValidImageSrc(src: string | null) {
  if (!src || src === "none") {
    return null;
  }

  if (src.startsWith("/")) {
    return src;
  }

  try {
    const url = new URL(src);
    return url.protocol === "http:" || url.protocol === "https:" ? src : null;
  } catch {
    return null;
  }
}

export function MessageItem({ message, currentUserId }: iAppProps) {
  const imageSrc = getValidImageSrc(message.imageUrl);
  const [isEditing, setIsEditing] = useState(false);
  const { openThread } = useThread();
  const queryClient = useQueryClient();

  //preloads the thread data into the cacche before the user click the button
  const prefetchThread = useCallback(() => {
    const options = orpc.message.thread.list.queryOptions({
      input: {
        messageId: message.id,
      },
    });
    queryClient
      .prefetchQuery({ ...options, staleTime: 60_000 })
      .catch(() => {});
  }, [message.id, queryClient]);

  return (
    <div className="flex space-x-3 relative p-2 rounded-lg group hover:bg-muted/50">
      <Image
        src={getAvatar(message.authorAvatar, message.authorEmail)}
        alt="User Avatar"
        width={32}
        height={32}
        className="size-8 rounded-lg"
      />
      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-center gap-x-2">
          <p className="font-medium leading-none">{message.authorName}</p>
          <p className="text-xs text-muted-foreground leading-none">
            {new Intl.DateTimeFormat("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }).format(message.createdAt)}{" "}
            {new Intl.DateTimeFormat("en-GB", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
            }).format(message.createdAt)}
          </p>
        </div>

        {isEditing ? (
          <EditMessage
            message={message}
            onCancel={() => setIsEditing(false)}
            onSave={() => setIsEditing(false)}
          />
        ) : (
          <>
            <SaveContent
              className="text-sm wrap-break-words prose dark:prose-invert max-w-none mark:text-primary"
              content={message.content}
            />

            {imageSrc && (
              <div className="mt-3">
                <Image
                  src={imageSrc}
                  alt="Image"
                  width={512}
                  height={512}
                  className="rounded-md borber border-border max-h-80 w-auto gap-2"
                />
              </div>
            )}

            {/* Reactions */}

            <ReactionsBar />

            {message.repliesCount > 0 && (
              <button
                type="button"
                className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border cursor-pointer"
                onClick={() => openThread(message.id)}
                onMouseOver={prefetchThread}
              >
                <MessageSquareIcon className="size-3.5" />
                <span className="">
                  {message.repliesCount}
                  {message.repliesCount === 1 ? "reply" : "replies"}
                </span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                  View Thread
                </span>
              </button>
            )}
          </>
        )}
      </div>
      <MessageHoverToolbar
        messageId={message.id}
        canEdit={message.authorId === currentUserId}
        onEdit={() => setIsEditing(true)}
      />
    </div>
  );
}
