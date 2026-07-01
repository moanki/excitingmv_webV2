"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Image as ImageIcon, Search, Trash2, Upload, Video } from "lucide-react";

import { deleteMediaLibraryAssetAction } from "@/app/admin/media/actions";
import { ActionForm, InlineSpinner } from "@/components/admin/action-feedback";
import { useAdminActionFeedback } from "@/components/admin/admin-action-feedback";
import type { MediaLibraryItem } from "@/components/media-field";
import { isRasterAdminImage, uploadAdminMediaFile, validateAdminMediaFile } from "@/lib/admin-media-client-upload";
import { optimizedImageUrl } from "@/lib/image-urls";

function typeIcon(type: MediaLibraryItem["type"]) {
  if (type === "video") return <Video className="admin-icon" />;
  if (type === "file") return <FileText className="admin-icon" />;
  return <ImageIcon className="admin-icon" />;
}

export function MediaManager({ items }: { items: MediaLibraryItem[] }) {
  const router = useRouter();
  const { finishAction, notifyError, startAction, updateAction } = useAdminActionFeedback();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadState, setUploadState] = useState<{ pending: boolean; message?: string; error?: string }>({ pending: false });
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(15);

  const visibleItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => !needle || item.name.toLowerCase().includes(needle) || item.url.toLowerCase().includes(needle));
  }, [items, query]);

  useEffect(() => setVisibleCount(15), [query]);

  async function upload(file: File) {
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
        folder: "media-library",
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

  return <div className="stack admin-list-page">
    <div className="table-toolbar media-manager-toolbar">
      <div className="table-toolbar-left">
        <label className="tbl-search" htmlFor="media-search"><Search className="admin-icon" /><input id="media-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search media..." /></label>
        <span className="tbl-count">{visibleItems.length} assets</span>
      </div>
      <input ref={fileInputRef} hidden type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv,video/mp4,video/webm,video/quicktime" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} />
      <button className="tbl-add" type="button" disabled={uploadState.pending} onClick={() => fileInputRef.current?.click()}>{uploadState.pending ? <InlineSpinner /> : <Upload className="admin-icon" />}{uploadState.pending ? "Uploading..." : "Upload"}</button>
    </div>

    {uploadState.error ? <p className="admin-alert admin-alert--error" data-admin-feedback-ignore="true">{uploadState.error}</p> : uploadState.message ? <p className="admin-alert admin-alert--success" data-admin-feedback-ignore="true">{uploadState.message}</p> : null}

    {visibleItems.length ? <div className="media-manager-grid">
      {visibleItems.slice(0, visibleCount).map((item) => <article className="media-manager-card" key={item.url}>
        <a className="media-manager-preview" href={item.url} target="_blank" rel="noreferrer">
          {item.type === "video" ? <video src={item.url} muted playsInline preload="metadata" /> : item.type === "image" ? <img src={optimizedImageUrl(item.url, { width: 360, height: 270, quality: 72 })} alt={item.name} width={360} height={270} loading="lazy" /> : <div className="media-manager-file">{typeIcon(item.type)}</div>}
        </a>
        <div className="media-manager-card__body"><div><strong>{item.name}</strong></div><ActionForm action={deleteMediaLibraryAssetAction} hidden={{ url: item.url }} idleLabel="" pendingLabel="" icon={<Trash2 className="admin-icon" />} variant="icon" buttonClassName="admin-icon-button--danger" ariaLabel={`Delete ${item.name}`} confirmMessage={`Delete ${item.name}?`} /></div>
      </article>)}
      {visibleCount < visibleItems.length ? <button className="admin-btn admin-btn--secondary media-library-load-more" type="button" onClick={() => setVisibleCount((count) => count + 15)}>Load 15 More</button> : null}
    </div> : <div className="admin-empty-panel"><h3>No media found</h3><p>Upload a file or adjust the search.</p></div>}
  </div>;
}
