"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, FileText, Image as ImageIcon, Search, Trash2, Upload, Video } from "lucide-react";

import { deleteMediaLibraryAssetAction } from "@/app/admin/media/actions";
import { ActionForm, InlineSpinner } from "@/components/admin/action-feedback";
import { useAdminActionFeedback } from "@/components/admin/admin-action-feedback";
import type { MediaLibraryItem } from "@/components/media-field";
import { formatUploadBytes, isRasterAdminImage, uploadAdminMediaFile, validateAdminMediaFile } from "@/lib/admin-media-client-upload";
import { optimizedImageUrl } from "@/lib/image-urls";

type MediaFilter = "all" | "images" | "resorts" | "hotels" | "liveaboards" | "travel-guide" | "files" | "documents";
type MediaSort = "newest" | "oldest" | "name-asc" | "name-desc" | "size-desc";
type UploadCategory = NonNullable<MediaLibraryItem["category"]>;

const filterOptions: Array<{ id: MediaFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "images", label: "Images" },
  { id: "resorts", label: "Resorts" },
  { id: "hotels", label: "Hotels" },
  { id: "liveaboards", label: "Liveaboards" },
  { id: "travel-guide", label: "Travel Guide" },
  { id: "files", label: "Files" },
  { id: "documents", label: "Documents" }
];

const uploadCategories: Array<{ id: UploadCategory; label: string }> = [
  { id: "general", label: "General media" },
  { id: "resorts", label: "Resorts" },
  { id: "hotels", label: "Hotels" },
  { id: "liveaboards", label: "Liveaboards" },
  { id: "travel-guide", label: "Travel Guide" },
  { id: "documents", label: "Documents" },
  { id: "files", label: "Files" }
];

const documentExtensions = new Set(["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"]);

function typeIcon(type: MediaLibraryItem["type"]) {
  if (type === "video") return <Video className="admin-icon" />;
  if (type === "file") return <FileText className="admin-icon" />;
  return <ImageIcon className="admin-icon" />;
}

function extension(item: MediaLibraryItem) {
  return (item.name || item.storedName || "file").split(".").pop()?.toLowerCase() || "file";
}

function isDocument(item: MediaLibraryItem) {
  return documentExtensions.has(extension(item)) || /pdf|word|excel|sheet|powerpoint|presentation|text\/plain/i.test(item.contentType || "");
}

function categoryLabel(category: MediaLibraryItem["category"]) {
  if (category === "travel-guide") return "Travel Guide";
  return category ? category[0].toUpperCase() + category.slice(1) : "General";
}

function dateLabel(value = "") {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function MediaManager({ items }: { items: MediaLibraryItem[] }) {
  const router = useRouter();
  const { finishAction, notifyError, startAction, updateAction } = useAdminActionFeedback();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadState, setUploadState] = useState<{ pending: boolean; message?: string; error?: string }>({ pending: false });
  const [selectedFileName, setSelectedFileName] = useState("");
  const [uploadCategory, setUploadCategory] = useState<UploadCategory>("general");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MediaFilter>("all");
  const [sort, setSort] = useState<MediaSort>("newest");
  const [visibleCount, setVisibleCount] = useState(15);

  const visibleItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = items.filter((item) => {
      const searchable = [item.name, item.storedName, item.url, item.category, item.contentType].filter(Boolean).join(" ").toLowerCase();
      const matchesSearch = !needle || searchable.includes(needle);
      const matchesFilter = filter === "all"
        || (filter === "images" && item.type === "image")
        || (filter === "files" && item.type !== "image")
        || (filter === "documents" && isDocument(item))
        || item.category === filter;
      return matchesSearch && matchesFilter;
    });

    return filtered.sort((left, right) => {
      if (sort === "oldest") return (left.createdAt || "").localeCompare(right.createdAt || "");
      if (sort === "name-asc") return left.name.localeCompare(right.name);
      if (sort === "name-desc") return right.name.localeCompare(left.name);
      if (sort === "size-desc") return (right.size || 0) - (left.size || 0);
      return (right.createdAt || "").localeCompare(left.createdAt || "");
    });
  }, [filter, items, query, sort]);

  useEffect(() => setVisibleCount(15), [filter, query, sort]);

  async function upload(file: File) {
    setSelectedFileName(file.name);
    const validationError = validateAdminMediaFile(file);
    if (validationError) {
      setUploadState({ pending: false, error: validationError });
      notifyError("Upload failed.", validationError);
      return;
    }

    const actionId = startAction({ title: "Preparing upload...", type: "upload", progress: null });
    setUploadState({ pending: true, message: isRasterAdminImage(file) ? "Uploading and optimizing image..." : "Uploading media..." });
    try {
      const result = await uploadAdminMediaFile(file, {
        folder: `media-library/${uploadCategory}`,
        onStatus: (status, message) => {
          setUploadState({ pending: true, message });
          updateAction(actionId, { title: message, progress: status === "uploading" ? 0 : null });
        },
        onProgress: (progress) => updateAction(actionId, {
          title: progress < 100 ? `Uploading... ${progress}%` : "Processing upload...",
          progress: progress < 100 ? progress : null
        })
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      const message = `${file.name} uploaded${result.compressed ? " and optimized" : ""}.`;
      setUploadState({ pending: false, message });
      finishAction(actionId, { title: "Upload complete.", message, status: "success" });
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload media.";
      setUploadState({ pending: false, error: message });
      finishAction(actionId, { title: "Upload failed.", message, status: "error" });
    }
  }

  async function copyUrl(item: MediaLibraryItem) {
    const actionId = startAction({ title: "Copying media URL...", type: "loading", progress: null });
    try {
      await navigator.clipboard.writeText(item.url);
      finishAction(actionId, { title: "URL copied.", message: item.name, status: "success" });
    } catch {
      finishAction(actionId, { title: "Copy failed.", message: "Copy the URL from the opened media preview.", status: "error" });
    }
  }

  return <div className="stack admin-list-page media-library-page">
    <div className="table-toolbar media-manager-toolbar">
      <div className="table-toolbar-left">
        <label className="tbl-search" htmlFor="media-search"><Search className="admin-icon" /><input id="media-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search names, categories, or file types..." /></label>
        <span className="tbl-count">{visibleItems.length} assets</span>
      </div>
      <div className="table-toolbar-right media-manager-toolbar__actions">
        <label className="media-manager-select"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value as MediaSort)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name-asc">Name A–Z</option><option value="name-desc">Name Z–A</option><option value="size-desc">Largest first</option></select></label>
        <label className="media-manager-select"><span>Upload to</span><select value={uploadCategory} onChange={(event) => setUploadCategory(event.target.value as UploadCategory)}>{uploadCategories.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select></label>
        <input ref={fileInputRef} hidden type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv,video/mp4,video/webm,video/quicktime" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} />
        <button className="tbl-add" type="button" disabled={uploadState.pending} onClick={() => fileInputRef.current?.click()}>{uploadState.pending ? <InlineSpinner /> : <Upload className="admin-icon" />}{uploadState.pending ? "Uploading..." : "Upload"}</button>
      </div>
    </div>

    <div className="media-manager-filters" role="tablist" aria-label="Media filters">
      {filterOptions.map((option) => <button key={option.id} type="button" role="tab" aria-selected={filter === option.id} className={filter === option.id ? "is-active" : ""} onClick={() => setFilter(option.id)}>{option.label}</button>)}
    </div>

    {selectedFileName ? <p className="media-manager-selected-name">Selected file: <strong>{selectedFileName}</strong> · Category: {categoryLabel(uploadCategory)}</p> : null}
    {uploadState.error ? <p className="admin-alert admin-alert--error" data-admin-feedback-ignore="true">{uploadState.error}</p> : uploadState.message ? <p className="admin-alert admin-alert--success" data-admin-feedback-ignore="true">{uploadState.message}</p> : null}

    {visibleItems.length ? <div className="media-manager-grid">
      {visibleItems.slice(0, visibleCount).map((item) => <article className="media-manager-card" key={item.url}>
        <a className="media-manager-preview" href={item.url} target="_blank" rel="noreferrer">
          {item.type === "video" ? <video src={item.url} muted playsInline preload="metadata" /> : item.type === "image" ? <img src={optimizedImageUrl(item.url, { width: 360, height: 270, quality: 72 })} alt={item.name} width={360} height={270} loading="lazy" /> : <div className="media-manager-file">{typeIcon(item.type)}<span>{extension(item).toUpperCase()}</span></div>}
        </a>
        <div className="media-manager-card__body">
          <div className="media-manager-card__copy"><strong title={item.name}>{item.name}</strong><span>{extension(item).toUpperCase()} · {item.size ? formatUploadBytes(item.size) : "Size unavailable"} · {dateLabel(item.createdAt)}</span><small>{categoryLabel(item.category)}</small></div>
          <div className="media-manager-card__actions"><button type="button" className="admin-icon-button" onClick={() => void copyUrl(item)} aria-label={`Copy URL for ${item.name}`} title="Copy URL"><Copy className="admin-icon" /></button><ActionForm action={deleteMediaLibraryAssetAction} hidden={{ url: item.url }} idleLabel="" pendingLabel="" icon={<Trash2 className="admin-icon" />} variant="icon" buttonClassName="admin-icon-button--danger" ariaLabel={`Delete ${item.name}`} confirmMessage={`Delete ${item.name}?`} /></div>
        </div>
      </article>)}
      {visibleCount < visibleItems.length ? <button className="admin-btn admin-btn--secondary media-library-load-more" type="button" onClick={() => setVisibleCount((count) => count + 15)}>Load 15 More</button> : null}
    </div> : <div className="admin-empty-panel"><h3>No media found</h3><p>Upload a file or adjust the search and filters.</p></div>}
  </div>;
}
