import { ThemeToggle } from "@/components/ui/theme-toogle";
import InviteMember from "./member/InviteMember";
import { MembersOverview } from "./member/MembersOverview";

interface ChannelHeaderProps {
  channelName: string | undefined;
}
export function ChannelHeader({ channelName }: ChannelHeaderProps) {
  return (
    <div className="flex items-center justify-between h-14 px-4 border-b">
      <h1>{channelName}</h1>

      <div className="flex itmes-center space-x-2">
        <MembersOverview />
        <InviteMember />
        <ThemeToggle />
      </div>
    </div>
  );
}
