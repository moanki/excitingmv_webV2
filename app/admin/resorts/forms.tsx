"use client";

import Link from "next/link";
import { useActionState, useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  Eye,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2
} from "lucide-react";

import {
  deleteResortAction,
  generateResortSeoAction,
  saveResortAction,
  seedResortsAction
} from "@/app/admin/resorts/actions";
import { MediaField, type MediaLibraryItem } from "@/components/media-field";
import type { PublishStatus, ResortPublishingMode } from "@/lib/types";
import type { ResortRecord } from "@/lib/services/resort-service";

type ResortEditorMode = "create" | "edit";
type ResortFilter = "all" | "published" | "draft" | "featured";

type EditableRoom = {
  name: string;
  description: string;
  seoDescription: string;
  photoUrl: string;
  sizeLabel: string;
  maxOccupancy: string;
  bedType: string;
  viewLabel: string;
  amenities: string;
};

function StatusMessage({ message, error }: { message?: string; error?: string }) {
  if (error) {
    return <p className="admin-alert admin-alert--error">{error}</p>;
  }

  if (message) {
    return <p className="admin-alert admin-alert--success">{message}</p>;
  }

  return null;
}

function publishingModeForResort(resort: Partial<ResortRecord>): ResortPublishingMode {
  if (resort.status === "published" && resort.isFeaturedHomepage) {
    return "published_featured";
  }

  if (resort.status === "published") {
    return "published_standard";
  }

  if (resort.status === "archived") {
    return "archived";
  }

  return "draft";
}

function statusLabel(resort: Partial<ResortRecord>) {
  if (resort.status === "published" && resort.isFeaturedHomepage) {
    return "Published Featured";
  }

  if (resort.status === "published") {
    return "Published";
  }

  if (resort.status === "archived") {
    return "Archived";
  }

  return "Draft";
}

function statusTone(resort: Partial<ResortRecord>) {
  if (resort.status === "published" && resort.isFeaturedHomepage) {
    return "is-featured";
  }

  if (resort.status === "published") {
    return "is-success";
  }

  if (resort.status === "archived") {
    return "is-muted";
  }

  return "is-draft";
}

function formatUpdatedLabel(value?: string) {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function splitLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function emptyRoom(): EditableRoom {
  return {
    name: "",
    description: "",
    seoDescription: "",
    photoUrl: "",
    sizeLabel: "",
    maxOccupancy: "",
    bedType: "",
    viewLabel: "",
    amenities: ""
  };
}

function AmenityListEditor({
  value,
  onChange
}: {
  value: string;
  onChange: (nextValue: string) => void;
}) {
  const [bulkDraft, setBulkDraft] = useState("");
  const amenities = useMemo(() => splitLines(value), [value]);

  function updateAmenities(nextAmenities: string[]) {
    onChange(nextAmenities.map((item) => item.trim()).filter(Boolean).join("\n"));
  }

  return (
    <div className="admin-amenity-editor">
      {amenities.length ? (
        <div className="admin-amenity-list">
          {amenities.map((amenity, index) => (
            <div className="admin-amenity-item" key={`${amenity}-${index}`}>
              <input
                className="admin-input"
                value={amenity}
                onChange={(event) => {
                  const next = [...amenities];
                  next[index] = event.target.value;
                  updateAmenities(next);
                }}
                placeholder="Amenity name"
              />
              <button
                type="button"
                className="admin-btn admin-btn--ghost admin-icon-only"
                onClick={() => updateAmenities(amenities.filter((_, amenityIndex) => amenityIndex !== index))}
                aria-label={`Remove amenity ${amenity}`}
              >
                <Trash2 className="admin-icon" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-empty-inline">
          <p>No amenities added yet.</p>
        </div>
      )}

      <div className="admin-amenity-actions">
        <button
          type="button"
          className="admin-btn admin-btn--secondary"
          onClick={() => updateAmenities([...amenities, ""])}
        >
          <Plus className="admin-icon" />
          Add Amenity
        </button>
      </div>

      <div className="field">
        <span className="field__label">Paste Multiple Amenities</span>
        <textarea
          className="admin-textarea admin-textarea--compact"
          value={bulkDraft}
          onChange={(event) => setBulkDraft(event.target.value)}
          placeholder="Paste one amenity per line"
        />
        <div className="admin-inline-actions">
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={() => {
              if (!bulkDraft.trim()) return;
              updateAmenities([...amenities, ...splitLines(bulkDraft)]);
              setBulkDraft("");
            }}
          >
            Add Lines To List
          </button>
        </div>
      </div>
    </div>
  );
}

function RoomTypeEditor({
  rooms,
  setRooms,
  mediaLibrary
}: {
  rooms: EditableRoom[];
  setRooms: React.Dispatch<React.SetStateAction<EditableRoom[]>>;
  mediaLibrary: MediaLibraryItem[];
}) {
  const [expandedRoomIndex, setExpandedRoomIndex] = useState<number | null>(rooms.length ? 0 : null);

  function updateRoom(index: number, updates: Partial<EditableRoom>) {
    setRooms((current) =>
      current.map((room, currentIndex) => (currentIndex === index ? { ...room, ...updates } : room))
    );
  }

  function addRoom() {
    setRooms((current) => [...current, emptyRoom()]);
    setExpandedRoomIndex(rooms.length);
  }

  function duplicateRoom(index: number) {
    setRooms((current) => {
      const next = [...current];
      next.splice(index + 1, 0, { ...current[index] });
      return next;
    });
    setExpandedRoomIndex(index + 1);
  }

  function removeRoom(index: number) {
    setRooms((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setExpandedRoomIndex((current) => {
      if (current === null) return null;
      if (current === index) return null;
      if (current > index) return current - 1;
      return current;
    });
  }

  return (
    <section className="admin-form-section" id="rooms">
      <div className="admin-form-section__header">
        <h3 className="admin-form-section__title">Rooms & Amenities</h3>
        <p className="admin-form-section__help">
          Manage each room type like a premium hotel profile with its own image, copy, facts, and amenities.
        </p>
      </div>

      {rooms.length ? (
        <div className="admin-room-stack">
          {rooms.map((room, index) => {
            const isExpanded = expandedRoomIndex === index;
            const amenityCount = splitLines(room.amenities).length;

            return (
              <article className={`admin-room-card${isExpanded ? " is-expanded" : ""}`} key={`room-${index}`}>
                <button
                  type="button"
                  className="admin-room-card__summary"
                  onClick={() => setExpandedRoomIndex((current) => (current === index ? null : index))}
                >
                  <div className="admin-room-card__thumb">
                    {room.photoUrl ? (
                      <img src={room.photoUrl} alt={room.name || `Room type ${index + 1}`} />
                    ) : (
                      <div className="admin-room-card__thumb-placeholder">Room Photo</div>
                    )}
                  </div>
                  <div className="admin-room-card__copy">
                    <div className="admin-room-card__eyebrow">Room Type {index + 1}</div>
                    <h4>{room.name || "Untitled room type"}</h4>
                    <p>
                      {[room.sizeLabel, room.maxOccupancy ? `${room.maxOccupancy} guests` : "", room.bedType, room.viewLabel]
                        .filter(Boolean)
                        .join(" · ") || "Add size, occupancy, bed type, and view details."}
                    </p>
                  </div>
                  <div className="admin-room-card__metrics">
                    <span>{amenityCount} amenities</span>
                    <span>{isExpanded ? "Collapse" : "Expand"}</span>
                  </div>
                </button>

                {isExpanded ? (
                  <div className="admin-room-card__body">
                    <div className="admin-room-card__actions">
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost"
                        onClick={() => duplicateRoom(index)}
                      >
                        Duplicate Room
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--danger"
                        onClick={() => removeRoom(index)}
                      >
                        Delete Room
                      </button>
                    </div>

                    <div className="form-grid">
                      <label className="field">
                        <span className="field__label">Room Name</span>
                        <input
                          className="admin-input"
                          name={`room_${index}_name`}
                          value={room.name}
                          onChange={(event) => updateRoom(index, { name: event.target.value })}
                        />
                      </label>
                      <label className="field">
                        <span className="field__label">Size Label</span>
                        <input
                          className="admin-input"
                          name={`room_${index}_sizeLabel`}
                          value={room.sizeLabel}
                          onChange={(event) => updateRoom(index, { sizeLabel: event.target.value })}
                          placeholder="e.g. 180 sqm"
                        />
                      </label>
                      <label className="field">
                        <span className="field__label">Max Occupancy</span>
                        <input
                          className="admin-input"
                          name={`room_${index}_maxOccupancy`}
                          type="number"
                          min="1"
                          value={room.maxOccupancy}
                          onChange={(event) => updateRoom(index, { maxOccupancy: event.target.value })}
                          placeholder="e.g. 3"
                        />
                      </label>
                      <label className="field">
                        <span className="field__label">Bed Type</span>
                        <input
                          className="admin-input"
                          name={`room_${index}_bedType`}
                          value={room.bedType}
                          onChange={(event) => updateRoom(index, { bedType: event.target.value })}
                          placeholder="e.g. King bed"
                        />
                      </label>
                      <label className="field">
                        <span className="field__label">View Label</span>
                        <input
                          className="admin-input"
                          name={`room_${index}_viewLabel`}
                          value={room.viewLabel}
                          onChange={(event) => updateRoom(index, { viewLabel: event.target.value })}
                          placeholder="e.g. Lagoon view"
                        />
                      </label>
                      <label className="field field--full">
                        <span className="field__label">Description</span>
                        <textarea
                          className="admin-textarea"
                          name={`room_${index}_description`}
                          value={room.description}
                          onChange={(event) => updateRoom(index, { description: event.target.value })}
                        />
                      </label>
                      <label className="field field--full">
                        <span className="field__label">SEO Description</span>
                        <textarea
                          className="admin-textarea"
                          name={`room_${index}_seoDescription`}
                          value={room.seoDescription}
                          onChange={(event) => updateRoom(index, { seoDescription: event.target.value })}
                        />
                      </label>
                    </div>

                    <MediaField
                      label={`Room photo ${index + 1}`}
                      inputName={`room_${index}_photoUrl`}
                      fileName={`room_${index}_photoFile`}
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      value={room.photoUrl}
                      library={mediaLibrary}
                      helper="This room photo appears on the public room card."
                    />

                    <div className="field field--full">
                      <span className="field__label">Amenities</span>
                      <p className="field__help">Add, edit, remove, or bulk-paste amenity lines for this room.</p>
                      <AmenityListEditor
                        value={room.amenities}
                        onChange={(nextValue) => updateRoom(index, { amenities: nextValue })}
                      />
                      <input type="hidden" name={`room_${index}_amenities`} value={room.amenities} />
                    </div>
                  </div>
                ) : (
                  <>
                    <input type="hidden" name={`room_${index}_name`} value={room.name} />
                    <input type="hidden" name={`room_${index}_description`} value={room.description} />
                    <input type="hidden" name={`room_${index}_seoDescription`} value={room.seoDescription} />
                    <input type="hidden" name={`room_${index}_photoUrl`} value={room.photoUrl} />
                    <input type="hidden" name={`room_${index}_sizeLabel`} value={room.sizeLabel} />
                    <input type="hidden" name={`room_${index}_maxOccupancy`} value={room.maxOccupancy} />
                    <input type="hidden" name={`room_${index}_bedType`} value={room.bedType} />
                    <input type="hidden" name={`room_${index}_viewLabel`} value={room.viewLabel} />
                    <input type="hidden" name={`room_${index}_amenities`} value={room.amenities} />
                  </>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="admin-empty-panel">
          <h4>No room types yet</h4>
          <p>Start with one room card, then add amenities, room facts, and a photo.</p>
        </div>
      )}

      <button type="button" className="admin-btn admin-btn--secondary" onClick={addRoom}>
        <Plus className="admin-icon" />
        Add Room Type
      </button>
    </section>
  );
}

export function ResortEditor({
  resort,
  title,
  description,
  mediaLibrary,
  mode
}: {
  resort: Partial<ResortRecord> & { id?: string; name?: string };
  title: string;
  description: string;
  mediaLibrary: MediaLibraryItem[];
  mode: ResortEditorMode;
}) {
  const [state, action, pending] = useActionState(saveResortAction, undefined);
  const [isGeneratingSeo, startSeoGeneration] = useTransition();
  const [rooms, setRooms] = useState<EditableRoom[]>(
    (resort.roomTypes ?? []).map((room) => ({
      name: room.name,
      description: room.description,
      seoDescription: room.seoDescription,
      photoUrl: room.photoUrl,
      sizeLabel: room.sizeLabel ?? "",
      maxOccupancy: room.maxOccupancy ? String(room.maxOccupancy) : "",
      bedType: room.bedType ?? "",
      viewLabel: room.viewLabel ?? "",
      amenities: (room.amenities ?? []).join("\n")
    }))
  );
  const [name, setName] = useState(resort.name ?? "");
  const [slug, setSlug] = useState(resort.slug ?? "");
  const [location, setLocation] = useState(resort.location ?? "");
  const [category, setCategory] = useState(resort.category ?? "");
  const [transferType, setTransferType] = useState(resort.transferType ?? "");
  const [status, setStatus] = useState<PublishStatus>(resort.status ?? "draft");
  const [isFeaturedHomepage, setIsFeaturedHomepage] = useState(Boolean(resort.isFeaturedHomepage));
  const [descriptionValue, setDescriptionValue] = useState(resort.description ?? resort.summary ?? "");
  const [highlightsValue, setHighlightsValue] = useState((resort.highlights ?? []).join("\n"));
  const [mealPlansValue, setMealPlansValue] = useState((resort.mealPlans ?? []).join("\n"));
  const [seoTitle, setSeoTitle] = useState(resort.seoTitle ?? resort.name ?? "");
  const [seoDescription, setSeoDescription] = useState(resort.seoDescription ?? resort.summary ?? "");
  const [seoSummary, setSeoSummary] = useState(resort.seoSummary ?? resort.summary ?? "");
  const [seoStatus, setSeoStatus] = useState<{ message?: string; error?: string } | null>(null);

  const formId = resort.id ? `resort-editor-form-${resort.id}` : "resort-editor-form-new";
  const previewHref = resort.slug ? `/resorts/${resort.slug}` : null;
  const currentPublishingMode =
    status === "published"
      ? isFeaturedHomepage
        ? "published_featured"
        : "published_standard"
      : status === "archived"
        ? "archived"
        : "draft";

  function handleGenerateSeo() {
    startSeoGeneration(async () => {
      setSeoStatus(null);
      const result = await generateResortSeoAction({
        name,
        location,
        category,
        transferType,
        description: descriptionValue,
        highlights: splitLines(highlightsValue),
        mealPlans: splitLines(mealPlansValue)
      });

      if (!result.ok) {
        setSeoStatus({ error: result.error });
        return;
      }

      setSeoTitle(result.data.seoTitle);
      setSeoDescription(result.data.seoDescription);
      setSeoSummary(result.data.seoSummary);
      setSeoStatus({ message: `Generated via ${result.data.provider} / ${result.data.model}.` });
    });
  }

  return (
    <section className="resort-workspace stack">
      <div className="resort-workspace__topbar">
        <Link href="/admin/resorts" className="admin-back-link">
          <ArrowLeft className="admin-icon" />
          Back to Resort Manager
        </Link>
        <div className="resort-workspace__topbar-actions">
          {previewHref ? (
            <Link className="admin-btn admin-btn--secondary" href={previewHref} target="_blank">
              <Eye className="admin-icon" />
              Preview Resort
            </Link>
          ) : null}
          <button className="admin-btn admin-btn--primary" type="submit" form={formId} disabled={pending}>
            {pending ? "Saving..." : mode === "create" ? "Create Resort" : "Save Changes"}
          </button>
        </div>
      </div>

      <header className="resort-workspace__header">
        <div className="resort-workspace__header-copy">
          <p className="eyebrow">{title}</p>
          <h1 className="section-title">{resort.name || "New resort workspace"}</h1>
          <p className="admin-page-lede">{description}</p>
        </div>
        <div className="resort-workspace__meta">
          <span className={`badge ${statusTone({ status, isFeaturedHomepage })}`}>{statusLabel({ status, isFeaturedHomepage })}</span>
          {resort.updatedAt ? <span>Updated {formatUpdatedLabel(resort.updatedAt)}</span> : null}
          {resort.roomTypes?.length ? <span>{resort.roomTypes.length} room types</span> : null}
        </div>
      </header>

      <nav className="admin-section-tabs" aria-label="Resort editor sections">
        <a href="#basics">Basics</a>
        <a href="#details">Details</a>
        <a href="#rooms">Rooms & Amenities</a>
        <a href="#media">Media</a>
        <a href="#seo-publish">SEO & Publish</a>
      </nav>

      <form id={formId} action={action} className="stack admin-form-card resort-workspace__form">
        {resort.id ? <input type="hidden" name="id" value={resort.id} /> : null}
        <input type="hidden" name="roomCount" value={rooms.length} />

        <section className="admin-form-section" id="basics">
          <div className="admin-form-section__header">
            <h3 className="admin-form-section__title">Basics</h3>
            <p className="admin-form-section__help">
              Core identity, location, category, transfer profile, and homepage feature state.
            </p>
          </div>

          <div className="form-grid">
            <label className="field">
              <span className="field__label">Resort Name</span>
              <input className="admin-input" name="name" value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="field">
              <span className="field__label">Slug</span>
              <input className="admin-input" name="slug" value={slug} onChange={(event) => setSlug(event.target.value)} />
            </label>
            <label className="field">
              <span className="field__label">Location / Atoll</span>
              <input
                className="admin-input"
                name="location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </label>
            <label className="field">
              <span className="field__label">Category</span>
              <input
                className="admin-input"
                name="category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              />
            </label>
            <label className="field">
              <span className="field__label">Transfer Type</span>
              <input
                className="admin-input"
                name="transferType"
                value={transferType}
                onChange={(event) => setTransferType(event.target.value)}
              />
            </label>
            <label className="field">
              <span className="field__label">Status</span>
              <select
                className="admin-select"
                name="status"
                value={status}
                onChange={(event) => setStatus(event.target.value as PublishStatus)}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="field field--full admin-toggle-field">
              <span className="field__label">Featured Homepage Toggle</span>
              <div className="admin-toggle-card">
                <div>
                  <strong>Feature on homepage</strong>
                  <p>Featured published resorts can appear in the homepage collection, up to 5 properties.</p>
                </div>
                <input
                  type="checkbox"
                  name="isFeaturedHomepage"
                  checked={isFeaturedHomepage}
                  onChange={(event) => setIsFeaturedHomepage(event.target.checked)}
                />
              </div>
            </label>
          </div>
        </section>

        <section className="admin-form-section" id="details">
          <div className="admin-form-section__header">
            <h3 className="admin-form-section__title">Details</h3>
            <p className="admin-form-section__help">
              Public-facing resort copy, highlights, and meal plan tags.
            </p>
          </div>

          <div className="form-grid">
            <label className="field field--full">
              <span className="field__label">Main Description</span>
              <textarea
                className="admin-textarea"
                name="description"
                value={descriptionValue}
                onChange={(event) => setDescriptionValue(event.target.value)}
              />
            </label>
            <label className="field field--full">
              <span className="field__label">Highlights</span>
              <textarea
                className="admin-textarea"
                name="highlights"
                value={highlightsValue}
                onChange={(event) => setHighlightsValue(event.target.value)}
                placeholder="One highlight per line"
              />
            </label>
            <label className="field field--full">
              <span className="field__label">Meal Plans</span>
              <textarea
                className="admin-textarea"
                name="mealPlans"
                value={mealPlansValue}
                onChange={(event) => setMealPlansValue(event.target.value)}
                placeholder="One meal plan per line"
              />
            </label>
          </div>
        </section>

        <RoomTypeEditor rooms={rooms} setRooms={setRooms} mediaLibrary={mediaLibrary} />

        <section className="admin-form-section" id="media">
          <div className="admin-form-section__header">
            <h3 className="admin-form-section__title">Media</h3>
            <p className="admin-form-section__help">
              Focus the public workflow on the resort banner image and room photos. Gallery fields are still available
              but kept secondary.
            </p>
          </div>

          <MediaField
            label="Resort banner image"
            inputName="heroImageUrl"
            fileName="heroImageFile"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            value={resort.heroImageUrl ?? ""}
            library={mediaLibrary}
            helper="Primary hero image for the resort listing, homepage feature, and property page."
          />

          <div className="field field--full">
            <span className="field__label">Optional Gallery URLs</span>
            <textarea
              className="admin-textarea admin-textarea--compact"
              name="galleryMediaUrls"
              defaultValue={(resort.galleryMediaUrls ?? []).join("\n")}
              placeholder="One image URL per line"
            />
            <p className="field__help">Kept for backend compatibility, but not the main public workflow.</p>
          </div>
        </section>

        <section className="admin-form-section" id="seo-publish">
          <div className="admin-form-section__header">
            <h3 className="admin-form-section__title">SEO & Publish</h3>
            <p className="admin-form-section__help">
              Review metadata, generate copy, and publish with a clear final checklist.
            </p>
          </div>

          <div className="admin-form-actions admin-form-actions--start">
            <button
              className="admin-btn admin-btn--secondary"
              type="button"
              onClick={handleGenerateSeo}
              disabled={isGeneratingSeo}
            >
              <Sparkles className="admin-icon" />
              {isGeneratingSeo ? "Generating SEO..." : "Generate SEO"}
            </button>
          </div>

          <div className="form-grid">
            <label className="field">
              <span className="field__label">SEO Title</span>
              <input className="admin-input" name="seoTitle" value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} />
            </label>
            <label className="field field--full">
              <span className="field__label">SEO Description</span>
              <textarea
                className="admin-textarea"
                name="seoDescription"
                value={seoDescription}
                onChange={(event) => setSeoDescription(event.target.value)}
              />
            </label>
            <label className="field field--full">
              <span className="field__label">SEO Summary</span>
              <textarea
                className="admin-textarea"
                name="seoSummary"
                value={seoSummary}
                onChange={(event) => setSeoSummary(event.target.value)}
              />
            </label>
          </div>

          <div className="admin-checklist-card">
            <h4>Content Checklist</h4>
            <ul>
              <li>{name.trim() ? "✓" : "•"} Resort name added</li>
              <li>{(resort.heroImageUrl ?? "").trim() ? "✓" : "•"} Banner image added</li>
              <li>{descriptionValue.trim() ? "✓" : "•"} Description added</li>
              <li>{rooms.length ? "✓" : "•"} Room types added</li>
              <li>{rooms.some((room) => splitLines(room.amenities).length) ? "✓" : "•"} Room amenities added</li>
              <li>{seoDescription.trim() ? "✓" : "•"} SEO description added</li>
            </ul>
          </div>

          {seoStatus?.message ? <p className="admin-alert admin-alert--success">{seoStatus.message}</p> : null}
          {seoStatus?.error ? <p className="admin-alert admin-alert--error">{seoStatus.error}</p> : null}
        </section>

        <div className="admin-form-actions resort-workspace__footer-actions">
          <Link href="/admin/resorts" className="admin-btn admin-btn--ghost">
            Cancel
          </Link>
          {resort.id ? (
            <button className="admin-btn admin-btn--danger" type="submit" form={`delete-resort-${resort.id}`}>
              Delete Resort
            </button>
          ) : null}
          <button
            className="admin-btn admin-btn--secondary"
            type="submit"
            name="publishingMode"
            value="draft"
            disabled={pending}
          >
            Save Draft
          </button>
          <button
            className="admin-btn admin-btn--primary"
            type="submit"
            name="publishingMode"
            value={currentPublishingMode === "archived" || currentPublishingMode === "draft"
              ? isFeaturedHomepage
                ? "published_featured"
                : "published_standard"
              : currentPublishingMode}
            disabled={pending}
          >
            {pending ? "Saving..." : "Publish Resort"}
          </button>
        </div>

        <StatusMessage message={state?.message} error={state?.error} />
      </form>

      {resort.id ? (
        <form id={`delete-resort-${resort.id}`} action={deleteResortAction}>
          <input type="hidden" name="id" value={resort.id} />
        </form>
      ) : null}
    </section>
  );
}

export function ResortManagerListView({ resorts }: { resorts: ResortRecord[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ResortFilter>("all");

  const filteredResorts = useMemo(() => {
    return resorts.filter((resort) => {
      const matchesQuery =
        !query.trim() ||
        [resort.name, resort.location, resort.category, resort.slug]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query.trim().toLowerCase()));

      if (!matchesQuery) {
        return false;
      }

      if (filter === "published") {
        return resort.status === "published";
      }

      if (filter === "draft") {
        return resort.status === "draft";
      }

      if (filter === "featured") {
        return resort.status === "published" && resort.isFeaturedHomepage;
      }

      return true;
    });
  }, [filter, query, resorts]);

  const filterOptions: Array<{ id: ResortFilter; label: string }> = [
    { id: "all", label: "All" },
    { id: "published", label: "Published" },
    { id: "draft", label: "Draft" },
    { id: "featured", label: "Featured" }
  ];

  return (
    <div className="stack">
      <div className="resort-manager-toolbar">
        <label className="resort-search-field" htmlFor="resort-search">
          <Search className="admin-icon" />
          <input
            id="resort-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search resorts..."
          />
        </label>
        <div className="resort-filter-pills" role="tablist" aria-label="Resort filters">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={filter === option.id ? "is-active" : ""}
              onClick={() => setFilter(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {filteredResorts.length ? (
        <div className="resort-manager-grid">
          {filteredResorts.map((resort) => (
            <article className="resort-manager-card" key={resort.id}>
              <div className="resort-manager-card__media">
                {resort.heroImageUrl ? (
                  <img src={resort.heroImageUrl} alt={resort.name} />
                ) : (
                  <div className="resort-manager-card__media-placeholder">No banner image</div>
                )}
              </div>
              <div className="resort-manager-card__body">
                <div className="resort-manager-card__topline">
                  <div>
                    <h3>{resort.name}</h3>
                    <p>
                      {[resort.location || "Maldives", resort.category || "Luxury Resort"].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="resort-manager-card__badges">
                    <span className={`badge ${statusTone(resort)}`}>{statusLabel(resort)}</span>
                    {resort.isFeaturedHomepage ? (
                      <span className="badge is-featured">
                        <Star className="admin-icon" />
                        Featured
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="resort-manager-card__meta">
                  <span>{resort.roomTypes.length} room types</span>
                  <span>Updated {formatUpdatedLabel(resort.updatedAt)}</span>
                </div>

                <div className="resort-manager-card__actions">
                  <Link className="admin-btn admin-btn--primary" href={`/admin/resorts/${resort.id}/edit`}>
                    <Pencil className="admin-icon" />
                    Edit
                  </Link>
                  {resort.slug ? (
                    <Link className="admin-btn admin-btn--secondary" href={`/resorts/${resort.slug}`} target="_blank">
                      <Eye className="admin-icon" />
                      Preview
                    </Link>
                  ) : null}
                  <form action={deleteResortAction}>
                    <input type="hidden" name="id" value={resort.id} />
                    <button className="admin-btn admin-btn--danger" type="submit">
                      <Trash2 className="admin-icon" />
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="admin-empty-panel">
          <h3>No resorts found</h3>
          <p>Try a different filter or add your first resort to start building the property collection.</p>
        </div>
      )}
    </div>
  );
}

export function SeedResortsButton() {
  return (
    <form action={seedResortsAction}>
      <button className="admin-btn admin-btn--secondary" type="submit">
        Seed Starter Properties
      </button>
    </form>
  );
}
