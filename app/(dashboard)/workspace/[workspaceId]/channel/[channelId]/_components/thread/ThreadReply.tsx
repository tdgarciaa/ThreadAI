import { SaveContent } from "@/components/rich-text-editor/SaveContent";
import { Message } from "@/generated/prisma/client";
import Image from "next/image";

interface ThreadReplyProps {
  message: Message;
}

export function ThreadReply({ message }: ThreadReplyProps) {
  return (
    <div className="flex space-x-3 p-3 hover:bg-muted/30 rounded-lg">
      <Image
        alt="Author Avatar"
        src={message.authorAvatar}
        width={24}
        height={24}
        className="size-6 rounded-full shrink-0"
      />
      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-sm">{message.authorName}</span>
          <span className="text-xs text-muted-foreground">
            {new Intl.DateTimeFormat("en-Us", {
              hour: "numeric",
              minute: "numeric",
              hour12: true,
              month: "short",
              day: "numeric",
            }).format(message.createdAt)}
          </span>
        </div>
        {/* <p className="text-sm break-words prose dark:prose-invert max-w-none">
          {message.content}
        </p> */}
        <SaveContent
          className="text-sm wrap-break-word prose dark:prose-invert max-w-none"
          content={message.content}
        />
      </div>
      {message.imageUrl && (
        <div className="mt-2">
          <Image
            src={message.imageUrl}
            alt="message attachment"
            width={512}
            height={512}
            className="rounded-md max-h-[320px] w-auto object-contain"
          />
        </div>
      )}
    </div>
  );
}
