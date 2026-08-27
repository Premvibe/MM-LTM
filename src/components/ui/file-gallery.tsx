import React from "react";
import { DriveFile } from "./file-upload";
import { ExternalLink, FileText, Image as ImageIcon, Video, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FileGalleryProps {
  files: DriveFile[];
  title?: string;
}

export const FileGallery: React.FC<FileGalleryProps> = ({ files = [], title }) => {
  if (!files || files.length === 0) return null;

  const isImage = (f: DriveFile) => f.mimeType?.startsWith("image/") || f.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isVideo = (f: DriveFile) => f.mimeType?.startsWith("video/") || f.fileName?.match(/\.(mp4|webm|mov)$/i);

  return (
    <div className="space-y-2 mt-2">
      {title && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary">
            {title} ({files.length})
          </Badge>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {files.map((file, idx) => (
          <div key={file.fileId || idx} className="group relative bg-muted/30 border border-muted-foreground/10 rounded-xl overflow-hidden p-2 flex flex-col justify-between hover:border-primary/30 transition-all">
            <div className="flex items-center gap-2 mb-2 min-w-0">
              {isImage(file) && <ImageIcon className="h-4 w-4 text-blue-500 shrink-0" />}
              {isVideo(file) && <Video className="h-4 w-4 text-purple-500 shrink-0" />}
              {!isImage(file) && !isVideo(file) && <FileText className="h-4 w-4 text-red-500 shrink-0" />}
              <span className="text-[10px] font-bold truncate" title={file.fileName}>
                {file.fileName}
              </span>
            </div>

            {file.fileUrl && (
              <a
                href={file.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center justify-center gap-1.5 py-1 px-2 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
              >
                <ExternalLink className="h-3 w-3" /> View in Drive
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
