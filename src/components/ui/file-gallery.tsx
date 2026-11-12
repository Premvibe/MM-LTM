import React, { useState } from "react";
import api from "@/lib/api";
import { DriveFile } from "./file-upload";
import { FileText, Image as ImageIcon, Video, X, Maximize2, Minimize2, Play, Download, ChevronLeft, ChevronRight, Eye, Archive, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FileGalleryProps {
  files?: DriveFile[];
  title?: string;
}

export const FileGallery: React.FC<FileGalleryProps> = ({ files = [], title }) => {
  const [activePreviewIndex, setActivePreviewIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!files || files.length === 0) return null;

  const isImage = (f: DriveFile) =>
    f.mimeType?.startsWith("image/") || !!f.fileName?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

  const isVideo = (f: DriveFile) =>
    f.mimeType?.startsWith("video/") || !!f.fileName?.match(/\.(mp4|webm|mov|m4v|avi)$/i);

  const isPdf = (f: DriveFile) =>
    f.mimeType === "application/pdf" || !!f.fileName?.match(/\.pdf$/i);

  const getImageSrc = (f: DriveFile) => {
    if (f.previewUrl) return f.previewUrl;
    if (f.fileId) {
      return `https://drive.google.com/thumbnail?id=${f.fileId}&sz=w1000`;
    }
    return f.thumbnailLink || f.fileUrl;
  };

  const [isZipping, setIsZipping] = useState(false);

  const handleDownloadAllZip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!files || files.length === 0) return;
    setIsZipping(true);
    const toastId = toast.loading(`Preparing ZIP archive for ${files.length} file(s)...`);

    try {
      const response = await api.post(
        "/drive/download-zip",
        {
          files,
          zipName: (title || "Media_Attachments").replace(/\s+/g, "_")
        },
        {
          responseType: "blob",
          timeout: 10 * 60 * 1000
        }
      );

      const blob = new Blob([response.data], { type: "application/zip" });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${(title || "Media_Attachments").replace(/\s+/g, "_")}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      toast.success(`Downloaded ${files.length} file(s) as ZIP!`, { id: toastId });
    } catch (err: any) {
      console.error("ZIP download error:", err);
      toast.error("Failed to generate ZIP: " + (err.response?.data?.message || err.message), { id: toastId });
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownload = (e: React.MouseEvent, file: DriveFile) => {
    e.stopPropagation();
    const downloadUrl = file.previewUrl || (file.fileId ? `https://drive.google.com/uc?export=download&id=${file.fileId}` : file.fileUrl);
    if (!downloadUrl) return;

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = file.fileName || "download";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeFile = activePreviewIndex !== null ? files[activePreviewIndex] : null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePreviewIndex !== null && activePreviewIndex > 0) {
      setActivePreviewIndex(activePreviewIndex - 1);
    } else {
      setActivePreviewIndex(files.length - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePreviewIndex !== null && activePreviewIndex < files.length - 1) {
      setActivePreviewIndex(activePreviewIndex + 1);
    } else {
      setActivePreviewIndex(0);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const closePreview = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    setIsFullscreen(false);
    setActivePreviewIndex(null);
  };

  return (
    <div className="space-y-3 mt-3">
      {title && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary">
            {title} ({files.length})
          </Badge>

          {files.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 px-2.5 rounded-lg text-[10px] font-bold border-primary/25 text-primary hover:bg-primary/10 gap-1.5 shadow-sm transition-all"
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              title="Download all attachments together as a ZIP file"
            >
              {isZipping ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Packaging ZIP...</span>
                </>
              ) : (
                <>
                  <Archive className="h-3 w-3" />
                  <span>Download All (ZIP)</span>
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Grid of inline previews */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {files.map((file, idx) => {
          const image = isImage(file);
          const video = isVideo(file);

          return (
            <div
              key={file.fileId || idx}
              className="group relative bg-muted/30 border border-muted-foreground/10 rounded-2xl overflow-hidden flex flex-col hover:border-primary/40 transition-all shadow-sm"
            >
              {/* Media Preview Area */}
              {image ? (
                <div
                  className="relative h-44 sm:h-52 w-full bg-black/5 dark:bg-white/5 overflow-hidden cursor-pointer"
                  onClick={() => setActivePreviewIndex(idx)}
                >
                  <img
                    src={getImageSrc(file)}
                    alt={file.fileName}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      if (file.fileId && !(e.target as HTMLImageElement).dataset.triedFallback) {
                        (e.target as HTMLImageElement).dataset.triedFallback = "true";
                        (e.target as HTMLImageElement).src = `https://lh3.googleusercontent.com/d/${file.fileId}`;
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="p-2.5 rounded-full bg-white/95 text-primary shadow-xl flex items-center gap-1.5 font-bold text-xs">
                      <Maximize2 className="h-4 w-4" /> View Full Screen
                    </span>
                  </div>
                </div>
              ) : video ? (
                <div className="relative h-48 sm:h-56 w-full bg-black overflow-hidden">
                  {/* Inline Playable Video Player */}
                  {file.fileId ? (
                    <iframe
                      src={`https://drive.google.com/file/d/${file.fileId}/preview`}
                      className="w-full h-full border-0"
                      allow="autoplay; encrypted-media; fullscreen"
                      allowFullScreen
                      title={file.fileName}
                    />
                  ) : file.previewUrl ? (
                    <video
                      src={file.previewUrl}
                      controls
                      preload="metadata"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center cursor-pointer bg-purple-950/40"
                      onClick={() => setActivePreviewIndex(idx)}
                    >
                      <Play className="h-10 w-10 text-white/90" />
                    </div>
                  )}
                </div>
              ) : (
                /* Document / PDF Tile */
                <div
                  className="h-44 w-full flex flex-col items-center justify-center p-4 bg-muted/40 cursor-pointer hover:bg-muted/60 transition-colors"
                  onClick={() => setActivePreviewIndex(idx)}
                >
                  <FileText className="h-12 w-12 text-red-500 mb-2" />
                  <span className="text-[11px] font-bold text-center line-clamp-2 px-2 text-foreground/80">
                    {file.fileName}
                  </span>
                  <span className="text-[10px] text-primary font-bold mt-2 flex items-center gap-1">
                    <Maximize2 className="h-3 w-3" /> View in Full Screen
                  </span>
                </div>
              )}

              {/* Bottom Action Bar */}
              <div className="flex items-center justify-between p-2.5 bg-background/90 backdrop-blur-sm border-t border-muted-foreground/10 text-xs">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {image && <ImageIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                  {video && <Video className="h-3.5 w-3.5 text-purple-500 shrink-0" />}
                  {!image && !video && <FileText className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                  <span className="text-[11px] font-bold truncate" title={file.fileName}>
                    {file.fileName}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {/* View / Play in Full Screen Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 rounded-lg text-primary hover:bg-primary/10 text-[11px] font-bold flex items-center gap-1"
                    title={video ? "Play in full screen" : "View in full screen"}
                    onClick={() => setActivePreviewIndex(idx)}
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{video ? "Play" : "View"}</span>
                  </Button>

                  {/* Download Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted text-[11px] font-bold flex items-center gap-1"
                    title="Download to device"
                    onClick={(e) => handleDownload(e, file)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Download</span>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full-Screen Lightbox Modal */}
      {activeFile && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in"
          onClick={closePreview}
        >
          <div
            className={`relative w-full ${isFullscreen ? "h-screen max-w-none rounded-none" : "max-w-6xl max-h-[94vh] rounded-2xl"} bg-background/95 overflow-hidden shadow-2xl border border-white/10 flex flex-col transition-all`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40 shrink-0">
              <div className="flex items-center gap-2 min-w-0 flex-1 pr-4">
                {isImage(activeFile) && <ImageIcon className="h-4 w-4 text-blue-500 shrink-0" />}
                {isVideo(activeFile) && <Video className="h-4 w-4 text-purple-500 shrink-0" />}
                {!isImage(activeFile) && !isVideo(activeFile) && <FileText className="h-4 w-4 text-red-500 shrink-0" />}
                <span className="font-bold text-xs sm:text-sm truncate" title={activeFile.fileName}>
                  {activeFile.fileName}
                </span>
                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                  ({(activePreviewIndex ?? 0) + 1} of {files.length})
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Download Button in Modal */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  onClick={(e) => handleDownload(e, activeFile)}
                  title="Download file"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </Button>

                {/* Fullscreen Toggle Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>

                {/* Close Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted"
                  onClick={closePreview}
                  title="Close preview"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Modal Media Body */}
            <div className="relative flex-1 overflow-auto flex items-center justify-center p-2 sm:p-4 bg-black/20 min-h-[350px]">
              {isImage(activeFile) ? (
                <img
                  src={getImageSrc(activeFile)}
                  alt={activeFile.fileName}
                  className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
                />
              ) : isVideo(activeFile) ? (
                <div className="w-full h-[75vh] max-w-5xl bg-black rounded-xl overflow-hidden shadow-2xl">
                  {activeFile.fileId ? (
                    <iframe
                      src={`https://drive.google.com/file/d/${activeFile.fileId}/preview`}
                      className="w-full h-full border-0"
                      allow="autoplay; encrypted-media; fullscreen"
                      allowFullScreen
                      title={activeFile.fileName}
                    />
                  ) : (
                    <video
                      src={activeFile.previewUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              ) : (
                /* PDF / Document Viewer */
                <div className="w-full h-[78vh] bg-background rounded-xl overflow-hidden shadow-2xl">
                  {activeFile.fileId ? (
                    <iframe
                      src={`https://drive.google.com/file/d/${activeFile.fileId}/preview`}
                      className="w-full h-full border-0"
                      title={activeFile.fileName}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="font-bold text-sm">{activeFile.fileName}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Prev / Next navigation arrows */}
              {files.length > 1 && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-background/85 hover:bg-background text-foreground shadow-2xl"
                    onClick={handlePrev}
                    title="Previous file"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-background/85 hover:bg-background text-foreground shadow-2xl"
                    onClick={handleNext}
                    title="Next file"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
