"use client";

import React from "react";
import { ChannelHeader } from "./_components/ChannelHeader";
import { MessageList } from "./_components/MessageList";
import { MessageInputForm } from "./_components/message/MessageInputForm";
import { useParams } from "next/navigation";
import { orpc } from "@/lib/orpc";
import { useQuery } from "@tanstack/react-query";

import type { KindeUser } from "@kinde-oss/kinde-auth-nextjs/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ThreadSideBar } from "./_components/thread/ThreadSideBar";
import { ThreadProvider } from "@/providers/ThreadProviders";
import { useThread } from "@/providers/ThreadProviders";
import { ChannelRealtimeProvider } from "@/providers/ChannelRealtimeProvider";

const ChannelPageMain = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const { isThreadOpen } = useThread();
  const { data, error, isLoading } = useQuery(
    orpc.channel.get.queryOptions({
      input: {
        channelId: channelId,
      },
    }),
  );

  if (error) {
    return <p> Error</p>;
  }
  return (
    <ChannelRealtimeProvider channelId={channelId}>
      <div className="flex h-screen w-full">
        <div className="flex flex-col flex-1 min-w-0 text-lg font-semibold">
          {isLoading ? (
            <div className="flex items-center justify-between h-14 px-4 border-b ">
              <Skeleton className="h-6 w-40" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ) : (
            <ChannelHeader channelName={data?.channelName} />
          )}
          <div className="flex-1 overflow-hidden">
            <MessageList />
          </div>
          <div className="border-t bg-background p-4">
            <MessageInputForm
              channelId={channelId}
              user={data?.currentUser as KindeUser<Record<string, unknown>>}
            />
          </div>
        </div>

        {isThreadOpen && (
          <ThreadSideBar
            user={data?.currentUser as KindeUser<Record<string, unknown>>}
          />
        )}
      </div>
    </ChannelRealtimeProvider>
  );
};

const ThisIsTheChannelPage = () => {
  return (
    <ThreadProvider>
      <ChannelPageMain />
    </ThreadProvider>
  );
};

export default ThisIsTheChannelPage;
