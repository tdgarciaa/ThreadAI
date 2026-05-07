"use client";

import React from "react";
import { ChannelHeader } from "./_components/ChannelHeader";
import { MessageList } from "./_components/MessageList";
import { MessageInputForm } from "./_components/message/MessageInputForm";
import { useParams } from "next/navigation";

const ChannelPageMain = () => {
  const { channelId } = useParams<{ channelId: string }>();

  return (
    <div className="flex h-screen w-full">
      <div className="flex flex-col flex-1 min-w-0 text-lg font-semibold">
        <ChannelHeader />
        <div className="flex-1 overflow-hidden">
          <MessageList />
        </div>
        <div className="border-t bg-background p-4">
          <MessageInputForm channelId={channelId} />
        </div>
      </div>
    </div>
  );
};

export default ChannelPageMain;
