import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Button } from "@/components/ui/button";
import { ImageIcon, Send } from "lucide-react";

interface iAppProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  isSubmiting?: boolean;
}
export function MessageComposer({ value, onChange, onSubmit }: iAppProps) {
  return (
    <>
      <RichTextEditor
        field={{ value, onChange }}
        sendButton={
          <Button type="button" size="sm" onClick={onSubmit}>
            <Send className="size-4 mr-1" />
            Send
          </Button>
        }
        footerLeft={
          <Button type="button" size="sm" variant="outline">
            <ImageIcon className="size-4 mr-1" />
            Attach
          </Button>
        }
      />
    </>
  );
}
