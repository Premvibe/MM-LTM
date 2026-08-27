import React, { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Upload, File, X, Loader2, ExternalLink, Image as ImageIcon, Video, FileText } from "lucide-react";
import { toast } from "sonner";

export interface DriveFile {
  fileId: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  thumbnailLink?: string;
  context?: string;
}

interface FileUploadProps {
  files: DriveFile[];
  onFilesChange: (files: DriveFile[]) => void;
  centreId?: string;
  centreName?: string;
  context?: string;
  monthYear?: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  label?: string;
}

const HIDE_DRIVE_UPLOAD = true;

export const FileUpload: React.FC<FileUploadProps> = ({
  files = [],
  onFilesChange,
  centreId,
  centreName,
  context = "General",
  monthYear,
  accept = "image/*,video/*,application/pdf,.doc,.docx,.ppt,.pptx",
  multiple = true,
  maxFiles = 5,
  label = "Upload Attachments"
}) => {
  if (HIDE_DRIVE_UPLOAD) return null;

  const [isUploading, setIsUploading] = useState(false);

  const getFileIcon = (mimeType?: string, fileName?: string) => {
    if (mimeType?.startsWith("image/") || fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return <ImageIcon className="h-4 w-4 text-blue-500" />;
    }
    if (mimeType?.startsWith("video/") || fileName?.match(/\.(mp4|webm|mov|avi)$/i)) {
      return <Video className="h-4 w-4 text-purple-500" />;
    }
    if (mimeType === "application/pdf" || fileName?.endsWith(".pdf")) {
      return <FileText className="h-4 w-4 text-red-500" />;
    }
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    if (!multiple && files.length >= 1) {
      toast.error("Only 1 file allowed for this section");
      return;
    }

    if (multiple && files.length + selectedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setIsUploading(true);
    const newUploadedFiles: DriveFile[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const formData = new FormData();
      formData.append("file", file);
      if (centreId) formData.append("centreId", centreId);
      if (centreName) formData.append("centreName", centreName);
      if (context) formData.append("context", context);
      if (monthYear) formData.append("monthYear", monthYear);

      try {
        const response = await api.post("/drive/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });

        const data = response.data;
        newUploadedFiles.push({
          fileId: data.fileId,
          fileName: data.fileName || file.name,
          fileUrl: data.webViewLink || data.webContentLink || "",
          mimeType: data.mimeType || file.type,
          thumbnailLink: data.thumbnailLink || "",
          context
        });
      } catch (err: any) {
        console.error("Upload error:", err);
        toast.error(`Failed to upload ${file.name}: ${err.response?.data?.message || err.message}`);
      }
    }

    if (newUploadedFiles.length > 0) {
      onFilesChange(multiple ? [...files, ...newUploadedFiles] : newUploadedFiles);
      toast.success(`Uploaded ${newUploadedFiles.length} file(s) successfully`);
    }

    setIsUploading(false);
    e.target.value = "";
  };

  const handleRemove = async (fileIdToRemove: string) => {
    try {
      if (fileIdToRemove) {
        await api.delete(`/drive/files/${fileIdToRemove}`).catch(() => {});
      }
    } catch (e) {
      // Ignore delete API errors locally
    }
    const updated = files.filter(f => f.fileId !== fileIdToRemove);
    onFilesChange(updated);
    toast.success("File removed");
  };

  return (
    <div className="space-y-3">
      {label && <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</label>}

      <div className="flex items-center gap-3">
        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold text-xs transition-all border border-primary/20">
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload to Drive
            </>
          )}
          <input
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
          />
        </label>

        <span className="text-[10px] text-muted-foreground font-semibold">
          {files.length}/{maxFiles} files uploaded
        </span>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {files.map((file, idx) => (
            <div
              key={file.fileId || idx}
              className="flex items-center justify-between p-2.5 bg-muted/40 rounded-xl border border-muted-foreground/10 text-xs gap-2"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {getFileIcon(file.mimeType, file.fileName)}
                <span className="font-bold truncate text-[11px]" title={file.fileName}>
                  {file.fileName}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {file.fileUrl && (
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-muted rounded text-primary"
                    title="Open in Drive"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:bg-destructive/10 rounded-lg"
                  onClick={() => handleRemove(file.fileId)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
