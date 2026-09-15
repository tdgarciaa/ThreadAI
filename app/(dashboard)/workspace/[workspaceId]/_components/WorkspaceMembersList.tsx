"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePresence } from "@/hooks/use-presence";
import { getAvatar } from "@/lib/get-avatar";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import { User } from "@/schemas/realtime";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useMemo } from "react";

export function WorkspaceMembersList() {
  const {
    data: { members },
  } = useSuspenseQuery(orpc.channel.list.queryOptions());

  const params = useParams();

  const workspaceId = params.workspaceId;

  const { data: worksapceData } = useQuery(orpc.workspace.list.queryOptions());

  const currentUser = worksapceData?.user
    ? ({
        id: worksapceData.user.id,
        full_name: worksapceData.user.given_name,
        email: worksapceData.user.email,
        picture: worksapceData.user.picture,
      } satisfies User)
    : null;

  const { onlineUsers } = usePresence({
    room: `workspace-${workspaceId}`,
    currentUser: currentUser,
  });

  const onlineUsersIds = useMemo(
    () => new Set(onlineUsers.map((u) => u.id)),
    [onlineUsers],
  );
  return (
    <div className="space-y-0.5 py-1">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <div className="relative">
            <Avatar className="relative size-8 shrink-0 overflow-hidden">
              <Image
                src={getAvatar(member.picture ?? null, member.email!)}
                alt="User Image"
                className="object-cover"
                fill
              />
              <AvatarFallback>
                {member.full_name?.charAt(0).toLocaleUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background bg-violet-500",

                member.id && onlineUsersIds.has(member.id)
                  ? "bg-green-500"
                  : "bg-gray-400",
              )}
            ></div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{member.full_name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {member.email}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
