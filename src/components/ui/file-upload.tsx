import React, { useState, useRef } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Upload, File, X, Loader2, Image as ImageIcon, Video, FileText, Download, Maximize2, Camera } from "lucide-react";
import { toast } from "sonner";

export interface DriveFile {
  fileId: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  thumbnailLink?: string;
  context?: string;
  previewUrl?: string;
}

interface FileUploadProps {
  files: DriveFile[];
  onFilesChange: (files: DriveFile[]) => void;
  centreId?: string;
  centreName?: string;
  context?: string;
  monthYear?: string;
  date?: string;
  subFolder?: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  label?: string;
}

const HIDE_DRIVE_UPLOAD = false;

export const FileUpload: React.FC<FileUploadProps> = ({
  files = [],
  onFilesChange,
  centreId,
  centreName,
  context = "General",
  monthYear,
  date,
  subFolder,
  accept = "image/*,video/*,application/pdf,.doc,.docx,.ppt,.pptx",
  multiple = true,
  maxFiles = 20,
  label = "Upload Attachments"
}) => {
  if (HIDE_DRIVE_UPLOAD) return null;

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [previewModalFile, setPreviewModalFile] = useState<DriveFile | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

  const isImage = (mimeType?: string, fileName?: string) =>
    mimeType?.startsWith("image/") || !!fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  const isVideo = (mimeType?: string, fileName?: string) =>
    mimeType?.startsWith("video/") || !!fileName?.match(/\.(mp4|webm|mov|avi)$/i);

  const getFileIcon = (mimeType?: string, fileName?: string) => {
    if (isImage(mimeType, fileName)) return <ImageIcon className="h-4 w-4 text-blue-500" />;
    if (isVideo(mimeType, fileName)) return <Video className="h-4 w-4 text-purple-500" />;
    if (mimeType === "application/pdf" || fileName?.endsWith(".pdf")) return <FileText className="h-4 w-4 text-red-500" />;
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  const processFiles = async (fileList: FileList | File[]) => {
    const selectedFiles = Array.from(fileList);
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

      // Limit check: 500MB max per file
      if (file.size > 500 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds the 500MB file size limit.`);
        continue;
      }

      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setUploadProgress(`Uploading ${i + 1}/${selectedFiles.length}: ${file.name} (${fileSizeMB}MB)...`);

      // Create local preview URL for images/videos
      let previewUrl = "";
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        previewUrl = URL.createObjectURL(file);
      }

      const formData = new FormData();
      formData.append("file", file);
      if (centreId) formData.append("centreId", centreId);
      if (centreName) formData.append("centreName", centreName);
      if (context) formData.append("context", context);
      if (monthYear) formData.append("monthYear", monthYear);
      if (date) formData.append("date", date);
      if (subFolder) formData.append("subFolder", subFolder);

      try {
        const response = await api.post("/drive/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 15 * 60 * 1000, // 15 mins for large videos
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              const mbLoaded = (progressEvent.loaded / (1024 * 1024)).toFixed(1);
              const mbTotal = (progressEvent.total / (1024 * 1024)).toFixed(1);
              setUploadProgress(`Uploading ${file.name} (${percent}% • ${mbLoaded}/${mbTotal}MB)`);
            }
          }
        });

        const data = response.data;
        newUploadedFiles.push({
          fileId: data.fileId,
          fileName: data.fileName || file.name,
          fileUrl: data.webViewLink || data.webContentLink || "",
          mimeType: data.mimeType || file.type,
          thumbnailLink: data.thumbnailLink || "",
          context,
          previewUrl
        });
      } catch (err: any) {
        console.error("Upload error:", err);
        const errorMsg = err.response?.data?.message || err.message;
        toast.error(`Failed to upload ${file.name}: ${errorMsg}`);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      }
    }

    if (newUploadedFiles.length > 0) {
      onFilesChange(multiple ? [...files, ...newUploadedFiles] : newUploadedFiles);
      toast.success(`Uploaded ${newUploadedFiles.length} file(s) successfully`);
    }

    setIsUploading(false);
    setUploadProgress("");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!isUploading && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = async (fileIdToRemove: string) => {
    const fileToRemove = files.find(f => f.fileId === fileIdToRemove);
    if (fileToRemove?.previewUrl) URL.revokeObjectURL(fileToRemove.previewUrl);
    try {
      if (fileIdToRemove) {
        await api.delete(`/drive/files/${fileIdToRemove}`).catch(() => {});
      }
    } catch (e) {}
    onFilesChange(files.filter(f => f.fileId !== fileIdToRemove));
    toast.success("File removed");
  };

  const getPreviewSrc = (file: DriveFile) => {
    if (file.previewUrl) return file.previewUrl;
    if (file.thumbnailLink) return file.thumbnailLink;
    if (file.fileId) return `https://drive.google.com/thumbnail?id=${file.fileId}&sz=w800`;
    return "";
  };

  return (
    <div className="space-y-3">
      {label && <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</label>}

      {/* Modern Drag-and-Drop Dropzone with Direct Camera & Video Buttons */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
          isDragging
            ? "border-primary bg-primary/10 shadow-lg scale-[1.01]"
            : "border-muted-foreground/20 hover:border-primary/40 bg-muted/10 hover:bg-muted/20"
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="p-2.5 bg-primary/10 text-primary rounded-full mb-1">
            <Upload className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs font-bold text-foreground">
              {isDragging ? "Drop your files here to upload!" : "Drag & drop photos or videos here, or choose an option:"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
              Up to {maxFiles} files • Max 500MB per file • Original quality
            </p>
          </div>

          {isUploading ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/15 text-primary rounded-xl font-bold text-xs mt-2 animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{uploadProgress || "Uploading..."}</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              {/* Option 1: File Browser */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl font-bold text-xs h-9 px-3 gap-1.5 border-primary/20 hover:bg-primary/10 text-primary shadow-sm"
              >
                <Upload className="h-3.5 w-3.5" /> Browse Files
              </Button>

              {/* Option 2: Direct Smartphone Camera (Take Photo) */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => cameraInputRef.current?.click()}
                className="rounded-xl font-bold text-xs h-9 px-3 gap-1.5 border-blue-500/20 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm"
                title="Open camera to take a photo"
              >
                <Camera className="h-3.5 w-3.5" /> Take Photo
              </Button>

              {/* Option 3: Direct Smartphone Video (Record Video) */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => videoInputRef.current?.click()}
                className="rounded-xl font-bold text-xs h-9 px-3 gap-1.5 border-purple-500/20 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-sm"
                title="Open camera to record a video"
              >
                <Video className="h-3.5 w-3.5" /> Record Video
              </Button>
            </div>
          )}

          {/* Hidden Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={(e) => {
              if (e.target.files) processFiles(e.target.files);
              e.target.value = "";
            }}
            disabled={isUploading}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple={multiple}
            onChange={(e) => {
              if (e.target.files) processFiles(e.target.files);
              e.target.value = "";
            }}
            disabled={isUploading}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            capture="environment"
            multiple={multiple}
            onChange={(e) => {
              if (e.target.files) processFiles(e.target.files);
              e.target.value = "";
            }}
            disabled={isUploading}
            className="hidden"
          />

          <span className="text-[10px] text-muted-foreground font-semibold mt-1">
            {files.length}/{maxFiles} files uploaded
          </span>
        </div>
      </div>

      {/* Inline previews for images and videos */}
      {files.length > 0 && (
        <div className="space-y-3 mt-3">
          {files.map((file, idx) => (
            <div
              key={file.fileId || idx}
              className="rounded-xl border border-muted-foreground/10 overflow-hidden bg-muted/30 shadow-sm"
            >
              {/* Image inline preview */}
              {isImage(file.mimeType, file.fileName) && (
                <div
                  className="relative bg-black/5 dark:bg-white/5 cursor-pointer group"
                  onClick={() => setPreviewModalFile(file)}
                >
                  <img
                    src={getPreviewSrc(file)}
                    alt={file.fileName}
                    className="w-full max-h-[300px] object-contain transition-transform group-hover:scale-[1.01]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-3 py-1.5 rounded-xl bg-white/95 text-primary text-xs font-bold shadow-lg flex items-center gap-1.5">
                      <Maximize2 className="h-3.5 w-3.5" /> Full Screen
                    </span>
                  </div>
                </div>
              )}

              {/* Video inline player */}
              {isVideo(file.mimeType, file.fileName) && (
                <div className="relative bg-black">
                  {file.previewUrl ? (
                    <video
                      src={file.previewUrl}
                      controls
                      preload="metadata"
                      className="w-full max-h-[300px]"
                    />
                  ) : (
                    <iframe
                      src={`https://drive.google.com/file/d/${file.fileId}/preview`}
                      className="w-full h-[300px]"
                      allow="autoplay; encrypted-media; fullscreen"
                      allowFullScreen
                      title={file.fileName}
                    />
                  )}
                </div>
              )}

              {/* File info bar */}
              <div className="flex items-center justify-between px-3 py-2 text-xs bg-background/80 border-t border-muted-foreground/10">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {getFileIcon(file.mimeType, file.fileName)}
                  <span className="font-bold truncate text-[11px]" title={file.fileName}>
                    {file.fileName}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {/* View / Play in Full Screen */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-primary hover:bg-primary/10 rounded-lg"
                    title={isVideo(file.mimeType, file.fileName) ? "Play full screen" : "View full screen"}
                    onClick={() => setPreviewModalFile(file)}
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </Button>

                  {/* Download */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                    title="Download file"
                    onClick={(e) => handleDownload(e, file)}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>

                  {/* Remove */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg"
                    title="Remove file"
                    onClick={() => handleRemove(file.fileId)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for viewing/playing full screen in upload area */}
      {previewModalFile && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          onClick={() => setPreviewModalFile(null)}
        >
          <div
            className="relative max-w-5xl max-h-[92vh] w-full bg-background rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40 shrink-0">
              <span className="font-bold text-xs sm:text-sm truncate pr-4">
                {previewModalFile.fileName}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5"
                  onClick={(e) => handleDownload(e, previewModalFile)}
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setPreviewModalFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-center min-h-[350px] max-h-[80vh] overflow-auto bg-black/20">
              {isImage(previewModalFile.mimeType, previewModalFile.fileName) ? (
                <img
                  src={getPreviewSrc(previewModalFile)}
                  alt={previewModalFile.fileName}
                  className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-xl"
                />
              ) : isVideo(previewModalFile.mimeType, previewModalFile.fileName) ? (
                <div className="w-full h-[70vh] max-w-4xl bg-black rounded-xl overflow-hidden shadow-xl">
                  {previewModalFile.previewUrl ? (
                    <video
                      src={previewModalFile.previewUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <iframe
                      src={`https://drive.google.com/file/d/${previewModalFile.fileId}/preview`}
                      className="w-full h-full border-0"
                      allow="autoplay; encrypted-media; fullscreen"
                      allowFullScreen
                      title={previewModalFile.fileName}
                    />
                  )}
                </div>
              ) : (
                <div className="w-full h-[70vh] bg-background rounded-xl overflow-hidden shadow-xl">
                  {previewModalFile.fileId ? (
                    <iframe
                      src={`https://drive.google.com/file/d/${previewModalFile.fileId}/preview`}
                      className="w-full h-full border-0"
                      title={previewModalFile.fileName}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="font-bold text-sm">{previewModalFile.fileName}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
