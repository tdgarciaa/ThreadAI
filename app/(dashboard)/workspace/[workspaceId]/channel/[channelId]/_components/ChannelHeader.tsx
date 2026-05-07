import { ThemeToggle } from "@/components/ui/theme-toogle";

export function ChannelHeader() {
  return (
    <div className="flex items-center justify-between h-14 px-4 border-b">
      <h1>Channel</h1>

      <div className="flex itmes-center space-x-2">
        <ThemeToggle />
      </div>
    </div>
  );
}
