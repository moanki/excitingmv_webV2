"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Image as ImageIcon, Library, Upload, Video } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

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

function fileKind(file: MediaLibraryItem) {
  if (file.type === "video") return <Video className="admin-icon" />;
  return <ImageIcon className="admin-icon" />;
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
  const [mode, setMode] = useState<"upload" | "library" | "url">(value ? "library" : "upload");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredLibrary = useMemo(() => {
    if (accept.includes("video")) {
      return library;
    }

    return library.filter((item) => item.type !== "video");
  }, [accept, library]);

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
    setUploadState({ pending: true, message: "Uploading media..." });
    clearNativeFileInput();

    try {
      const response = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "create-upload-url",
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          folder: "resorts"
        })
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            data?: {
              bucket: string;
              path: string;
              token: string;
              publicUrl: string;
              contentType: string;
            };
          }
        | null;

      if (!response.ok || !payload?.ok || !payload.data) {
        throw new Error(payload?.error || "Could not prepare the media upload.");
      }

      const supabase = createSupabaseBrowserClient();
      const uploaded = await supabase.storage
        .from(payload.data.bucket)
        .uploadToSignedUrl(payload.data.path, payload.data.token, file, {
          contentType: payload.data.contentType || file.type || undefined
        });

      if (uploaded.error) {
        throw new Error(uploaded.error.message);
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
      </div>

      <input type="hidden" name={inputName} value={selectedUrl} />

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

      {mode === "upload" ? (
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

      {mode === "url" ? (
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

      {mode === "library" ? (
        <div className="media-library">
          <div className="media-library-header">
            <Library className="admin-icon" />
            <span>Select from media library</span>
          </div>
          {filteredLibrary.length ? (
            <div className="media-library-grid">
              {filteredLibrary.map((item) => (
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
                      <video src={item.url} muted playsInline />
                    ) : (
                      <img src={item.url} alt={item.name} />
                    )}
                  </div>
                  <div className="media-library-meta">
                    {fileKind(item)}
                    <span>{item.name}</span>
                  </div>
                </button>
              ))}
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
