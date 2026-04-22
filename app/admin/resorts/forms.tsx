"use client";

import { useActionState, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { deleteResortAction, saveResortAction, seedResortsAction } from "@/app/admin/resorts/actions";
import { MediaField, type MediaLibraryItem } from "@/components/media-field";
import type { ResortPublishingMode } from "@/lib/types";
import type { ResortRecord } from "@/lib/services/resort-service";

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
    return "Published Standard";
  }

  if (resort.status === "archived") {
    return "Archived";
  }

  return "Draft";
}

function RoomTypeEditor({
  rooms,
  setRooms,
  mediaLibrary
}: {
  rooms: { name: string; description: string; seoDescription: string; photoUrl: string }[];
  setRooms: React.Dispatch<
    React.SetStateAction<{ name: string; description: string; seoDescription: string; photoUrl: string }[]>
  >;
  mediaLibrary: MediaLibraryItem[];
}) {
  return (
    <section className="admin-form-section">
      <div className="admin-form-section__header">
        <h3 className="admin-form-section__title">Room Types</h3>
        <p className="admin-form-section__help">
          Add the room name, guest-facing description, SEO summary, and a primary room photo.
        </p>
      </div>

      <div className="stack">
        {rooms.map((room, index) => (
          <div className="panel panel-soft" key={`room-${index}`}>
            <div className="admin-page-header">
              <div className="admin-page-header__content">
                <p className="eyebrow">Room Type {index + 1}</p>
                <h3>{room.name || "New room type"}</h3>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                onClick={() => setRooms((current) => current.filter((_, currentIndex) => currentIndex !== index))}
              >
                Remove
              </button>
            </div>

            <div className="form-grid">
              <label className="field">
                <span className="field__label">Room Name</span>
                <input
                  className="admin-input"
                  name={`room_${index}_name`}
                  value={room.name}
                  onChange={(event) =>
                    setRooms((current) =>
                      current.map((item, currentIndex) =>
                        currentIndex === index ? { ...item, name: event.target.value } : item
                      )
                    )
                  }
                />
              </label>
              <label className="field field--full">
                <span className="field__label">Description</span>
                <textarea
                  className="admin-textarea"
                  name={`room_${index}_description`}
                  value={room.description}
                  onChange={(event) =>
                    setRooms((current) =>
                      current.map((item, currentIndex) =>
                        currentIndex === index ? { ...item, description: event.target.value } : item
                      )
                    )
                  }
                />
              </label>
              <label className="field field--full">
                <span className="field__label">SEO Description</span>
                <textarea
                  className="admin-textarea"
                  name={`room_${index}_seoDescription`}
                  value={room.seoDescription}
                  onChange={(event) =>
                    setRooms((current) =>
                      current.map((item, currentIndex) =>
                        currentIndex === index ? { ...item, seoDescription: event.target.value } : item
                      )
                    )
                  }
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
              helper="Primary photo shown on the public room type card."
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        className="admin-btn admin-btn--secondary"
        onClick={() =>
          setRooms((current) => [...current, { name: "", description: "", seoDescription: "", photoUrl: "" }])
        }
      >
        Add Room Type
      </button>
    </section>
  );
}

function ResortEditor({
  resort,
  title,
  description,
  mediaLibrary
}: {
  resort: Partial<ResortRecord> & { id?: string; name?: string };
  title: string;
  description: string;
  mediaLibrary: MediaLibraryItem[];
}) {
  const [state, action, pending] = useActionState(saveResortAction, undefined);
  const [rooms, setRooms] = useState(
    (resort.roomTypes ?? []).map((room) => ({
      name: room.name,
      description: room.description,
      seoDescription: room.seoDescription,
      photoUrl: room.photoUrl
    }))
  );

  return (
    <div className="panel resort-editor" id={resort.id ? `resort-editor-${resort.id}` : "resort-editor-new"}>
      <div className="admin-page-header">
        <div className="admin-page-header__content">
          <p className="eyebrow">{title}</p>
          <h2>{resort.name || "New resort"}</h2>
          <p className="admin-page-lede">{description}</p>
        </div>
      </div>

      <form action={action} className="stack admin-form-card">
        {resort.id ? <input type="hidden" name="id" value={resort.id} /> : null}
        <input type="hidden" name="roomCount" value={rooms.length} />

        <section className="admin-form-section">
          <div className="admin-form-section__header">
            <h3 className="admin-form-section__title">Overview</h3>
            <p className="admin-form-section__help">
              Basic information of the resort: resort name, category, atoll, transfer type, and publishing mode.
              Published Featured resorts surface in the homepage featured area, up to 5 resorts.
            </p>
          </div>

          <div className="form-grid">
            <label className="field">
              <span className="field__label">Resort Name</span>
              <input className="admin-input" name="name" defaultValue={resort.name ?? ""} />
            </label>
            <label className="field">
              <span className="field__label">Slug</span>
              <input className="admin-input" name="slug" defaultValue={resort.slug ?? ""} />
            </label>
            <label className="field">
              <span className="field__label">Atoll</span>
              <input className="admin-input" name="location" defaultValue={resort.location ?? ""} />
            </label>
            <label className="field">
              <span className="field__label">Category</span>
              <input className="admin-input" name="category" defaultValue={resort.category ?? ""} />
            </label>
            <label className="field">
              <span className="field__label">Transfer Type</span>
              <input className="admin-input" name="transferType" defaultValue={resort.transferType ?? ""} />
            </label>
            <label className="field">
              <span className="field__label">Status</span>
              <select
                className="admin-select"
                name="publishingMode"
                defaultValue={publishingModeForResort(resort)}
              >
                <option value="draft">Draft</option>
                <option value="published_standard">Published Standard</option>
                <option value="published_featured">Published Featured</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>
        </section>

        <section className="admin-form-section">
          <div className="admin-form-section__header">
            <h3 className="admin-form-section__title">Description</h3>
            <p className="admin-form-section__help">About the resort and the public-facing summary for listing cards.</p>
          </div>
          <div className="form-grid">
            <label className="field field--full">
              <span className="field__label">About Resort</span>
              <textarea
                className="admin-textarea"
                name="description"
                defaultValue={resort.description ?? resort.summary ?? ""}
              />
            </label>
            <label className="field field--full">
              <span className="field__label">Highlights</span>
              <textarea
                className="admin-textarea"
                name="highlights"
                defaultValue={(resort.highlights ?? []).join("\n")}
                placeholder="One highlight per line"
              />
            </label>
          </div>
        </section>

        <section className="admin-form-section">
          <div className="admin-form-section__header">
            <h3 className="admin-form-section__title">Commercial Details</h3>
            <p className="admin-form-section__help">
              Meal plans such as Half Board, Full Board, and All Inclusive.
            </p>
          </div>
          <div className="form-grid">
            <label className="field field--full">
              <span className="field__label">Meal Plans</span>
              <textarea
                className="admin-textarea"
                name="mealPlans"
                defaultValue={(resort.mealPlans ?? []).join("\n")}
                placeholder="One meal plan per line"
              />
            </label>
          </div>
        </section>

        <section className="admin-form-section">
          <div className="admin-form-section__header">
            <h3 className="admin-form-section__title">SEO</h3>
            <p className="admin-form-section__help">Descriptions used for the resort listing, detail page, and imports.</p>
          </div>
          <div className="form-grid">
            <label className="field">
              <span className="field__label">SEO Title</span>
              <input className="admin-input" name="seoTitle" defaultValue={resort.seoTitle ?? resort.name ?? ""} />
            </label>
            <label className="field field--full">
              <span className="field__label">SEO Description</span>
              <textarea
                className="admin-textarea"
                name="seoDescription"
                defaultValue={resort.seoDescription ?? resort.summary ?? ""}
              />
            </label>
            <label className="field field--full">
              <span className="field__label">SEO Summary</span>
              <textarea
                className="admin-textarea"
                name="seoSummary"
                defaultValue={resort.seoSummary ?? resort.summary ?? ""}
              />
            </label>
          </div>
        </section>

        <section className="admin-form-section">
          <div className="admin-form-section__header">
            <h3 className="admin-form-section__title">Resort Banner</h3>
            <p className="admin-form-section__help">
              Main hero image that appears in the resort table, public detail page, and homepage featured area.
            </p>
          </div>

          <MediaField
            label="Main hero image"
            inputName="heroImageUrl"
            fileName="heroImageFile"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            value={resort.heroImageUrl ?? ""}
            library={mediaLibrary}
            helper="Upload, drag and drop, or select from the media library."
          />

          <label className="field field--full">
            <span className="field__label">Additional gallery images</span>
            <textarea
              className="admin-textarea"
              name="galleryMediaUrls"
              defaultValue={(resort.galleryMediaUrls ?? []).join("\n")}
              placeholder="One image URL per line, or upload new files below."
            />
          </label>

          <label className="field field--full">
            <span className="field__label">Upload gallery images</span>
            <input
              className="admin-file-input"
              name="galleryMediaFiles"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              multiple
            />
          </label>
        </section>

        <RoomTypeEditor rooms={rooms} setRooms={setRooms} mediaLibrary={mediaLibrary} />

        <div className="admin-form-actions">
          {resort.id ? (
            <button className="admin-btn admin-btn--danger" type="submit" form={`delete-resort-${resort.id}`}>
              Delete Resort
            </button>
          ) : null}
          <button className="admin-btn admin-btn--primary" type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Resort"}
          </button>
        </div>

        <StatusMessage message={state?.message} error={state?.error} />
      </form>

      {resort.id ? (
        <form id={`delete-resort-${resort.id}`} action={deleteResortAction}>
          <input type="hidden" name="id" value={resort.id} />
        </form>
      ) : null}
    </div>
  );
}

export function ResortInventoryTable({
  resorts
}: {
  resorts: ResortRecord[];
}) {
  return (
    <div className="admin-table-shell">
      <table className="table">
        <thead>
          <tr>
            <th>Resort Banner</th>
            <th>Resort Name</th>
            <th>Atoll</th>
            <th>Category</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {resorts.map((resort) => (
            <tr key={resort.id}>
              <td>
                {resort.heroImageUrl ? (
                  <img src={resort.heroImageUrl} alt={resort.name} className="admin-table-thumb" />
                ) : (
                  <div className="admin-table-thumb admin-table-thumb--empty">No image</div>
                )}
              </td>
              <td>{resort.name}</td>
              <td>{resort.location || "-"}</td>
              <td>{resort.category || "-"}</td>
              <td><span className="badge">{statusLabel(resort)}</span></td>
              <td>
                <div className="card-actions">
                  <a className="admin-btn admin-btn--secondary" href={`#resort-editor-${resort.id}`}>
                    <Pencil className="admin-icon" />
                    Edit
                  </a>
                  <form action={deleteResortAction}>
                    <input type="hidden" name="id" value={resort.id} />
                    <button className="admin-btn admin-btn--danger" type="submit" aria-label={`Delete ${resort.name}`}>
                      <Trash2 className="admin-icon" />
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CreateResortForm({ mediaLibrary }: { mediaLibrary: MediaLibraryItem[] }) {
  return (
    <ResortEditor
      resort={{ status: "draft", isFeaturedHomepage: false, roomTypes: [] }}
      title="Create Resort"
      description="Add a new resort with its hero image, commercial details, SEO, and room types."
      mediaLibrary={mediaLibrary}
    />
  );
}

export function ExistingResortForms({
  resorts,
  mediaLibrary
}: {
  resorts: ResortRecord[];
  mediaLibrary: MediaLibraryItem[];
}) {
  return (
    <div className="stack">
      {resorts.map((resort) => (
        <ResortEditor
          key={resort.id}
          resort={resort}
          title="Edit Resort"
          description="Update overview, description, commercial details, room types, and homepage feature state."
          mediaLibrary={mediaLibrary}
        />
      ))}
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
