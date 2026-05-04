"use client";

import { useActionState, useMemo, useState } from "react";
import { FileText, Image as ImageIcon, Search, Trash2, Upload, Video } from "lucide-react";

import { deleteMediaLibraryAssetAction, uploadMediaLibraryAssetAction } from "@/app/admin/media/actions";
import type { MediaLibraryItem } from "@/components/media-field";

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
  const [state, action, pending] = useActionState(uploadMediaLibraryAssetAction, undefined);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | MediaLibraryItem["type"]>("all");

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

  return (
    <div className="stack">
      <section>
        <p className="eyebrow">Content / Media Library</p>
        <h1 className="section-title">Manage reusable website media.</h1>
        <p className="muted">
          Upload resort banners, room photos, homepage assets, logos, badges, and documents from one place.
        </p>
      </section>

      <form action={action} encType="multipart/form-data" className="admin-form-card media-manager-upload">
        <div>
          <h3>Upload Media</h3>
          <p>New uploads appear in resort media pickers immediately after save.</p>
        </div>
        <div className="form-grid">
          <label className="field field--full">
            <span className="field__label">Media File</span>
            <input
              className="admin-input"
              type="file"
              name="mediaFile"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf,video/mp4,video/webm,video/quicktime"
            />
          </label>
          <label className="field">
            <span className="field__label">Optimization Profile</span>
            <select className="admin-select" name="usage" defaultValue="full">
              <option value="full">Full image</option>
              <option value="banner">Banner / hero</option>
              <option value="card">Card / gallery</option>
              <option value="logo">Logo / badge</option>
            </select>
          </label>
        </div>
        <div className="admin-form-actions admin-form-actions--start">
          <button className="admin-btn admin-btn--primary" type="submit" disabled={pending}>
            <Upload className="admin-icon" />
            {pending ? "Uploading..." : "Upload To Library"}
          </button>
        </div>
        <StatusMessage message={state?.message} error={state?.error} />
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
            {visibleItems.map((item) => (
              <article className="media-manager-card" key={item.url}>
                <a className="media-manager-preview" href={item.url} target="_blank" rel="noreferrer">
                  {item.type === "video" ? (
                    <video src={item.url} muted playsInline />
                  ) : item.type === "image" ? (
                    <img src={item.url} alt={item.name} />
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
