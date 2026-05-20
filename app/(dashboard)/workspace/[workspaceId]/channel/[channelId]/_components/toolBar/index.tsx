import { MessageSquareText, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface toolBarProps {
  messageId: string;
  canEdit: boolean;
  onEdit: () => void;
}

export function MessageHoverToolbar({
  canEdit,
  onEdit,
  messageId,
}: toolBarProps) {
  return (
    <div className="absolute -right-2 -top-1 items-center gap-1 rounded-md border border-gray-200 bg-white/90 px-1.5 py-1 shadow-sm backdrop-blue transition-opacity opacity-0 group-hover:opacity-100 dark:border-neutral-800 dark:bg-neutral-900/90 ">
      {canEdit && (
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil />
        </Button>
      )}

      <Button variant="ghost" size="icon">
        <MessageSquareText />
      </Button>
    </div>
  );
}
