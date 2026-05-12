import { UploadDropzone } from "@/lib/uploadthing";
import { DialogContent, Dialog, DialogHeader, DialogTitle } from "../ui/dialog";
import { toast } from "sonner";

interface ImageUpdateModalProps {
  open: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
  onUploaded: (url: string) => void;
}

export function ImageUploadModal({
  open,
  onOpenChange,
  onUploaded,
}: ImageUpdateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Image</DialogTitle>
        </DialogHeader>
        <UploadDropzone
          className="ut-uploading:opacity/90 ut-ready:bg-card ut-ready:border-border ut-ready:text-foreground
          ut-uploading:bg-muted ut-uploading:border-border ut-uploading:text-muted-foreground
          ut-label:text-sm ut-label:text-muted-foreground ut-allowed-content:text-xs ut-allowed-content:text-muted-foreground
          ut-button:bg-primary ut-button:text-primary-foreground rounded-lg border"
          appearance={{
            container: "bg-card",
            label: "text-muted-foreground",
            allowedContent: "text-xs text-muted-foreground",
            button:
              "bg-primary text-primary-foreground hover:bg-foreground/50 ",
            uploadIcon: "text-muted-foreground",
          }}
          endpoint={"imageUploader"}
          onClientUploadComplete={(res) => {
            const url = res[0].ufsUrl;

            toast.success("Image Uploaded Succesfully");

            onUploaded(url);
          }}
          onUploadError={(error) => {
            toast.error(error.message);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
