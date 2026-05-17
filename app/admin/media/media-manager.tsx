"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FileText, Image as ImageIcon, Search, Trash2, Upload, Video } from "lucide-react";

import { deleteMediaLibraryAssetAction } from "@/app/admin/media/actions";
import type { MediaLibraryItem } from "@/components/media-field";
import { optimizedImageUrl } from "@/lib/image-urls";

function StatusMessage({ message, error }: { message?: string; error?: string }) {
  if (error) {
    return <p className="admin-alert admin-alert--error">{error}</p>;
  }

  if (message) {
    return <p className="admin-alert admin-alert--success">{message}</p>;
  }

  return null;
}

function typeIcon(type: MediaLibraryItem["type"]) {
  if (type === "video") return <Video className="admin-icon" />;
  if (type === "file") return <FileText className="admin-icon" />;
  return <ImageIcon className="admin-icon" />;
}

function typeLabel(type: MediaLibraryItem["type"]) {
  if (type === "video") return "Video";
  if (type === "file") return "File";
  return "Image";
}

export function MediaManager({ items }: { items: MediaLibraryItem[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<{ pending: boolean; message?: string; error?: string }>({
    pending: false
  });
  const [compressionState, setCompressionState] = useState<{ pending: boolean; message?: string; error?: string }>({
    pending: false
  });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | MediaLibraryItem["type"]>("all");
  const [visibleCount, setVisibleCount] = useState(6);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesType = filter === "all" || item.type === filter;
      const matchesQuery =
        !normalizedQuery ||
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.url.toLowerCase().includes(normalizedQuery);

      return matchesType && matchesQuery;
    });
  }, [filter, items, query]);

  useEffect(() => {
    setVisibleCount(6);
  }, [filter, query]);

  const pagedItems = visibleItems.slice(0, visibleCount);

  async function uploadSelectedFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setUploadState({ pending: false, error: "Choose an image, video, or file to upload." });
      return;
    }

    setUploadState({ pending: true, message: "Uploading media..." });

    try {
      const formData = new FormData();
      formData.set("mode", "upload-media");
      formData.set("folder", "media-library");
      formData.set("mediaFile", selectedFile);

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
              compressed?: boolean;
            };
          }
        | null;

      if (!response.ok || !payload?.ok || !payload.data) {
        throw new Error(payload?.error || "Could not upload the selected media.");
      }

      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setUploadState({
        pending: false,
        message: payload.data.compressed
          ? `${selectedFile.name} uploaded and compressed.`
          : `${selectedFile.name} uploaded.`
      });
      router.refresh();
    } catch (error) {
      setUploadState({
        pending: false,
        error: error instanceof Error ? error.message : "Failed to upload media."
      });
    }
  }

  async function compressExistingImages() {
    setCompressionState({ pending: true, message: "Compressing existing images..." });

    try {
      const response = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "compress-existing-images" })
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            data?: {
              scanned: number;
              compressed: number;
              skipped: number;
              failed: number;
              savedBytes: number;
            };
          }
        | null;

      if (!response.ok || !payload?.ok || !payload.data) {
        throw new Error(payload?.error || "Could not compress existing images.");
      }

      const savedMb = (payload.data.savedBytes / (1024 * 1024)).toFixed(2);
      setCompressionState({
        pending: false,
        message: `Compressed ${payload.data.compressed} image${payload.data.compressed === 1 ? "" : "s"} and saved ${savedMb} MB. ${payload.data.failed ? `${payload.data.failed} failed.` : ""}`.trim()
      });
      router.refresh();
    } catch (error) {
      setCompressionState({
        pending: false,
        error: error instanceof Error ? error.message : "Failed to compress existing images."
      });
    }
  }

  return (
    <div className="stack">
      <form onSubmit={uploadSelectedFile} className="admin-form-card media-manager-upload">
        <div>
          <h3>Upload Media</h3>
          <p>New uploads appear in resort media pickers immediately after save.</p>
        </div>
        <div className="form-grid">
          <label className="field field--full">
            <span className="field__label">Media File</span>
            <input
              ref={fileInputRef}
              className="admin-input"
              type="file"
              name="mediaFile"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv,video/mp4,video/webm,video/quicktime"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <div className="admin-form-actions admin-form-actions--start">
          <button className="admin-btn admin-btn--primary" type="submit" disabled={uploadState.pending}>
            <Upload className="admin-icon" />
            {uploadState.pending ? "Uploading..." : "Upload To Library"}
          </button>
          <button
            className="admin-btn admin-btn--secondary"
            type="button"
            disabled={compressionState.pending}
            onClick={compressExistingImages}
          >
            {compressionState.pending ? "Compressing..." : "Compress Current Images"}
          </button>
        </div>
        <StatusMessage message={uploadState.message} error={uploadState.error} />
        <StatusMessage message={compressionState.message} error={compressionState.error} />
      </form>

      <section className="admin-form-card media-manager-library">
        <div className="media-manager-toolbar">
          <label className="resort-search-field" htmlFor="media-search">
            <Search className="admin-icon" />
            <input
              id="media-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search media..."
            />
          </label>
          <div className="resort-filter-pills" role="tablist" aria-label="Media filters">
            {(["all", "image", "video", "file"] as const).map((option) => (
              <button
                key={option}
                type="button"
                className={filter === option ? "is-active" : ""}
                onClick={() => setFilter(option)}
              >
                {option === "all" ? "All" : typeLabel(option)}
              </button>
            ))}
          </div>
        </div>

        {visibleItems.length ? (
          <div className="media-manager-grid">
            {pagedItems.map((item) => (
              <article className="media-manager-card" key={item.url}>
                <a className="media-manager-preview" href={item.url} target="_blank" rel="noreferrer">
                  {item.type === "video" ? (
                    <video src={item.url} muted playsInline preload="metadata" />
                  ) : item.type === "image" ? (
                    <img
                      src={optimizedImageUrl(item.url, { width: 360, height: 270, quality: 72 })}
                      alt={item.name}
                      width={360}
                      height={270}
                      loading="lazy"
                    />
                  ) : (
                    <div className="media-manager-file">{typeIcon(item.type)}</div>
                  )}
                </a>
                <div className="media-manager-card__body">
                  <div>
                    <span>
                      {typeIcon(item.type)}
                      {typeLabel(item.type)}
                    </span>
                    <strong>{item.name}</strong>
                  </div>
                  <form action={deleteMediaLibraryAssetAction}>
                    <input type="hidden" name="url" value={item.url} />
                    <button className="admin-btn admin-btn--danger admin-icon-only" type="submit" aria-label={`Delete ${item.name}`}>
                      <Trash2 className="admin-icon" />
                    </button>
                  </form>
                </div>
              </article>
            ))}
            {visibleCount < visibleItems.length ? (
              <button
                className="admin-btn admin-btn--secondary media-library-load-more"
                type="button"
                onClick={() => setVisibleCount((count) => count + 6)}
              >
                Load 6 More
              </button>
            ) : null}
          </div>
        ) : (
          <div className="admin-empty-panel">
            <h3>No media found</h3>
            <p>Upload a file or adjust the search and filter.</p>
          </div>
        )}
      </section>
    </div>
  );
}
