"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Image as ImageIcon, Library, Upload, Video } from "lucide-react";

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
  helper
}: MediaFieldProps) {
  const inputId = useId();
  const [selectedUrl, setSelectedUrl] = useState(value);
  const [selectedFileName, setSelectedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredLibrary = useMemo(() => {
    if (accept.includes("video")) {
      return library;
    }

    return library.filter((item) => item.type !== "video");
  }, [accept, library]);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setSelectedFileName(file?.name ?? "");
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file || !fileInputRef.current) {
      return;
    }

    const transfer = new DataTransfer();
    transfer.items.add(file);
    fileInputRef.current.files = transfer.files;
    setSelectedFileName(file.name);
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

      <label
        htmlFor={inputId}
        className="media-dropzone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
      >
        <Upload className="media-dropzone-icon" />
        <strong>Drag and drop a file here</strong>
        <span>or click to upload from your device</span>
        {selectedFileName ? <small>Selected file: {selectedFileName}</small> : null}
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

      <label className="field">
        <span>Direct URL</span>
        <input
          value={selectedUrl}
          onChange={(event) => setSelectedUrl(event.target.value)}
          placeholder="https://..."
        />
      </label>

      {filteredLibrary.length ? (
        <div className="media-library">
          <div className="media-library-header">
            <Library className="admin-icon" />
            <span>Select from media library</span>
          </div>
          <div className="media-library-grid">
            {filteredLibrary.map((item) => (
              <button
                type="button"
                key={item.url}
                className={selectedUrl === item.url ? "media-library-item is-active" : "media-library-item"}
                onClick={() => setSelectedUrl(item.url)}
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
        </div>
      ) : null}
    </div>
  );
}
