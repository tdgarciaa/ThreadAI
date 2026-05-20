import { Message } from "@/generated/prisma/client";
import Image from "next/image";
import { getAvatar } from "@/lib/get-avatar";
import { SaveContent } from "@/components/rich-text-editor/SaveContent";
import { MessageHoverToolbar } from "../toolBar";
import { useState } from "react";
import { EditMessage } from "../toolBar/EditMesage";
import { flattenError } from "zod";

interface iAppProps {
  message: Message;
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
              className="text-sm break-words prose dark:prose-invert max-w-none mark:text-primary"
              content={message.content}
            />

            {imageSrc && (
              <div className="mt-3">
                <Image
                  src={imageSrc}
                  alt="Image"
                  width={512}
                  height={512}
                  className="rounded-md borber border-border max-h-[320px] w-auto gap-2"
                />
              </div>
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
