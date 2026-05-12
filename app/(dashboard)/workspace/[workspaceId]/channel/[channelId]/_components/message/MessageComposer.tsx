import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { ImageUploadModal } from "@/components/rich-text-editor/ImageUploadModal";
import { Button } from "@/components/ui/button";
import { ImageIcon, Send } from "lucide-react";
import { useAttachmentUploadType } from "@/hooks/use-attachment-upload";
import { AttachmentChip } from "./AttachmentChip";

interface iAppProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  isSubmiting?: boolean;
  upload: useAttachmentUploadType;
}

export function MessageComposer({
  value,
  onChange,
  onSubmit,
  isSubmiting,
  upload,
}: iAppProps) {
  return (
    <>
      <RichTextEditor
        field={{ value, onChange }}
        sendButton={
          <Button
            disabled={isSubmiting}
            type="button"
            size="sm"
            onClick={onSubmit}
          >
            <Send className="size-4 mr-1" />
            Send
          </Button>
        }
        footerLeft={
          upload.stagedUrl ? (
            <AttachmentChip url={upload.stagedUrl} onRemove={upload.clear} />
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => upload.setOpen(true)}
            >
              <ImageIcon className="size-4 mr-1" />
              Attach
            </Button>
          )
        }
      />
      <ImageUploadModal
        onUploaded={(url) => upload.onUploaded(url)}
        open={upload.isOpen}
        onOpenChange={upload.setOpen}
      />
    </>
  );
}
