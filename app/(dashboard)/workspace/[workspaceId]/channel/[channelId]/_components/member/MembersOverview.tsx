import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UsersIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { MemberItem } from "./MemberItem";
import { Skeleton } from "@/components/ui/skeleton";
import { usePresence } from "@/hooks/use-presence";
import { useParams } from "next/navigation";
import { User } from "@/schemas/realtime";
import { useMemo } from "react";

export function MembersOverview() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const params = useParams();
  const { data, isLoading, error } = useQuery(
    orpc.workspace.member.list.queryOptions(),
  );

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
  if (error) {
    return <h1>Error:{error.message}</h1>;
  }

  const members = data ?? [];
  const query = search.trim().toLowerCase();
  const fileteredMembers = query
    ? members.filter((m) => {
        const name = m.full_name?.toLocaleLowerCase();
        const email = m.email?.toLocaleLowerCase();
        return name?.includes(query) || email?.includes(query);
      })
    : members;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline">
          <UsersIcon />
          <span>Members</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <div className="p-0">
          <div className="p-x-3 py-3 border-b">
            <h3 className="font-semibold text-sm ">Workspace Members</h3>
            <p className="text-xs text-muted-foreground">Members</p>
          </div>
        </div>
        <div className=" border-b pt-0 pb-4">
          <div className="relative ">
            <Search className="size-4 absolute left-3 top-1/4 transform-translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Members"
              className="pl-9 h-8"
            />
          </div>
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2">
                  <Skeleton className="size-8 rounded-full" />
                  <div>
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))
            ) : fileteredMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground pt-4 px-2">
                No members found
              </p>
            ) : (
              fileteredMembers.map((m) => (
                <MemberItem
                  member={m}
                  key={m.id}
                  isOnline={m.id ? onlineUsersIds.has(m.id) : false}
                />
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
