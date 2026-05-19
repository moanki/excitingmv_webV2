"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { FileText, Image as ImageIcon, Library, Upload, Video } from "lucide-react";

import { optimizedImageUrl } from "@/lib/image-urls";

export type MediaLibraryItem = {
  name: string;
  url: string;
  type: "image" | "video" | "file";
};

type MediaFieldProps = {
  label: string;
  inputName: string;
  fileName: string;
  accept: string;
  value?: string;
  library?: MediaLibraryItem[];
  helper?: string;
  onChange?: (url: string) => void;
};

const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;

function fileKind(file: MediaLibraryItem) {
  if (file.type === "video") return <Video className="admin-icon" />;
  if (file.type === "file") return <FileText className="admin-icon" />;
  return <ImageIcon className="admin-icon" />;
}

function fileExtension(file: File) {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

function validateMediaFieldFile(file: File, accept: string) {
  const extension = fileExtension(file);

  if (file.size > MAX_UPLOAD_SIZE) {
    return "File is too large. Keep uploads under 50 MB.";
  }

  if (["heic", "heif"].includes(extension) || ["image/heic", "image/heif"].includes(file.type)) {
    return "HEIC images are not supported yet. Please convert to JPG or PNG.";
  }

  const acceptParts = accept
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const extensionAccepted = acceptParts.some((item) => item.startsWith(".") && item.slice(1) === extension);
  const typeAccepted = acceptParts.includes(file.type.toLowerCase());

  if (!extensionAccepted && !typeAccepted) {
    return "Unsupported file type for this field.";
  }

  return "";
}

export function MediaField({
  label,
  inputName,
  fileName,
  accept,
  value = "",
  library = [],
  helper,
  onChange
}: MediaFieldProps) {
  const inputId = useId();
  const [selectedUrl, setSelectedUrl] = useState(value);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [uploadState, setUploadState] = useState<{ pending: boolean; error?: string; message?: string }>({
    pending: false
  });
  const [mode, setMode] = useState<"upload" | "library" | "url">("upload");
  const [expanded, setExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredLibrary = useMemo(() => {
    if (accept.includes("application/") || accept.includes("text/")) {
      return library;
    }

    if (accept.includes("video")) {
      return library;
    }

    return library.filter((item) => item.type !== "video");
  }, [accept, library]);

  const visibleLibrary = useMemo(() => filteredLibrary.slice(0, visibleCount), [filteredLibrary, visibleCount]);

  useEffect(() => {
    setVisibleCount(6);
  }, [mode, filteredLibrary.length]);

  useEffect(() => {
    const form = fileInputRef.current?.form;
    if (!form) return;

    function preventPendingUpload(event: SubmitEvent) {
      if (!uploadState.pending) return;
      event.preventDefault();
      setUploadState({
        pending: true,
        error: "Please wait for the media upload to finish before saving."
      });
    }

    form.addEventListener("submit", preventPendingUpload);
    return () => form.removeEventListener("submit", preventPendingUpload);
  }, [uploadState.pending]);

  function updateSelectedUrl(url: string) {
    setSelectedUrl(url);
    onChange?.(url);
  }

  function clearNativeFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function uploadFileDirectly(file: File) {
    setSelectedFileName(file.name);
    updateSelectedUrl("");
    const validationError = validateMediaFieldFile(file, accept);
    if (validationError) {
      setUploadState({ pending: false, error: validationError });
      clearNativeFileInput();
      return;
    }

    const isOptimizable = ["image/png", "image/jpeg", "image/webp"].includes(file.type) || ["png", "jpg", "jpeg", "webp"].includes(fileExtension(file));
    setUploadState({ pending: true, message: isOptimizable ? "Uploading and optimizing image..." : "Uploading media..." });
    clearNativeFileInput();

    try {
      const formData = new FormData();
      formData.set("mode", "upload-media");
      formData.set("folder", "media-library");
      formData.set("mediaFile", file);

      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            data?: {
              publicUrl: string;
            };
          }
        | null;

      if (!response.ok || !payload?.ok || !payload.data) {
        throw new Error(payload?.error || "Could not upload the selected media.");
      }

      updateSelectedUrl(payload.data.publicUrl);
      setUploadState({ pending: false, message: `${file.name} uploaded and ready to save.` });
    } catch (error) {
      setUploadState({
        pending: false,
        error: error instanceof Error ? error.message : "Media upload failed."
      });
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    void uploadFileDirectly(file);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file || !fileInputRef.current) {
      return;
    }

    const transfer = new DataTransfer();
    transfer.items.add(file);
    fileInputRef.current.files = transfer.files;
    void uploadFileDirectly(file);
  }

  return (
    <div className="media-field">
      <div className="media-field-header">
        <div>
          <span className="media-field-label">{label}</span>
          {helper ? <p className="media-field-helper">{helper}</p> : null}
        </div>
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Hide media tools" : selectedUrl ? "Change media" : "Upload or select"}
        </button>
      </div>

      <input type="hidden" name={inputName} value={selectedUrl} />

      {selectedUrl ? (
        <div className="media-selected-state">
          <div>
            <strong>Current selection</strong>
            <p>{selectedUrl}</p>
          </div>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => updateSelectedUrl("")}>
            Clear
          </button>
        </div>
      ) : null}

      {expanded ? (
        <div className="media-field-modes">
          <button
            type="button"
            className={mode === "upload" ? "media-mode is-active" : "media-mode"}
            onClick={() => setMode("upload")}
          >
            Upload
          </button>
          <button
            type="button"
            className={mode === "library" ? "media-mode is-active" : "media-mode"}
            onClick={() => setMode("library")}
          >
            Media Library
          </button>
          <button
            type="button"
            className={mode === "url" ? "media-mode is-active" : "media-mode"}
            onClick={() => setMode("url")}
          >
            Direct URL
          </button>
        </div>
      ) : null}

      {expanded && mode === "upload" ? (
        <>
          <label
            htmlFor={inputId}
            className={isDragging ? "media-dropzone is-dragging" : "media-dropzone"}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
          >
            <Upload className="media-dropzone-icon" />
            <strong>Drag and drop a file here</strong>
            <span>or click to upload from your device</span>
            {selectedFileName ? <small>Selected file: {selectedFileName}</small> : null}
            {uploadState.pending ? <small>Uploading directly to media library...</small> : null}
            {uploadState.message ? <small>{uploadState.message}</small> : null}
            {uploadState.error ? <small className="media-dropzone-error">{uploadState.error}</small> : null}
          </label>

          <input
            id={inputId}
            ref={fileInputRef}
            className="media-dropzone-input"
            name={fileName}
            type="file"
            accept={accept}
            onChange={onFileChange}
          />
        </>
      ) : null}

      {expanded && mode === "url" ? (
        <label className="field">
          <span className="field__label">Direct URL</span>
          <input
            className="admin-input"
            value={selectedUrl}
            onChange={(event) => updateSelectedUrl(event.target.value)}
            placeholder="https://..."
          />
        </label>
      ) : null}

      {expanded && mode === "library" ? (
        <div className="media-library">
          <div className="media-library-header">
            <Library className="admin-icon" />
            <span>Select from media library</span>
          </div>
          {filteredLibrary.length ? (
            <div className="media-library-scroll">
              <div className="media-library-grid">
                {visibleLibrary.map((item) => (
                  <button
                    type="button"
                    key={item.url}
                    className={selectedUrl === item.url ? "media-library-item is-active" : "media-library-item"}
                    onClick={() => {
                      updateSelectedUrl(item.url);
                      setSelectedFileName("");
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    <div className="media-library-preview">
                      {item.type === "video" ? (
                        <video preload="metadata" src={item.url} muted playsInline />
                      ) : (
                        <img
                          src={optimizedImageUrl(item.url, { width: 260, height: 195, quality: 70 })}
                          alt={item.name}
                          width={260}
                          height={195}
                          loading="lazy"
                        />
                      )}
                    </div>
                    <div className="media-library-meta">
                      {fileKind(item)}
                      <span>{item.name}</span>
                    </div>
                  </button>
                ))}
              </div>
              {visibleCount < filteredLibrary.length ? (
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary media-library-load-more"
                  onClick={() => setVisibleCount((count) => count + 6)}
                >
                  Load more media
                </button>
              ) : null}
            </div>
          ) : (
            <div className="empty-state">
              <strong>No library items yet</strong>
              <p>Upload the first asset in this field and it will appear here for reuse.</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
