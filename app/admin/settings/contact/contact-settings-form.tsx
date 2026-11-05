"use client";

import Link from "next/link";
import { ChevronDown, Plus } from "lucide-react";
import { useActionState, useState } from "react";

import { saveContactDraftAction } from "@/app/admin/settings/actions";
import { ActionMessage } from "@/components/admin/action-feedback";
import { MediaField, type MediaLibraryItem } from "@/components/media-field";
import { optimizedImageUrl } from "@/lib/image-urls";
import type { ContactPageContent, ContactRegion } from "@/lib/site-content";

export function ContactSettingsForm({ contact, mediaLibrary }: {
  contact: ContactPageContent;
  mediaLibrary: MediaLibraryItem[];
}) {
  const [state, action, pending] = useActionState(saveContactDraftAction, undefined);
  const [page, setPage] = useState({ title: contact.title, subtitle: contact.subtitle, ctaText: contact.ctaText, ctaLabel: contact.ctaLabel, ctaHref: contact.ctaHref });
  const [departments, setDepartments] = useState(contact.departments);
  const [regions, setRegions] = useState(contact.regions.map((region, index) => ({ ...region, formKey: `contact-${index}` })));
  const [expandedContact, setExpandedContact] = useState<string | null>(null);

  function updateRegion(formKey: string, changes: Partial<ContactRegion>) {
    setRegions((items) => items.map((item) => item.formKey === formKey ? { ...item, ...changes } : item));
  }

  function addContact() {
    const formKey = crypto.randomUUID();
    setRegions((items) => [...items, {
      formKey, departmentId: departments[0]?.id ?? "", regionTitle: "", location: "", contactName: "", role: "",
      photoUrl: "", email: "", whatsapp: "", displayOrder: Math.max(0, ...items.map((item) => item.displayOrder)) + 1, enabled: true
    }]);
    setExpandedContact(formKey);
  }

  return (
    <div className="team-editor">
      <header className="te-header">
        <h1>Team</h1>
        <Link className="button-muted" href="/contact" target="_blank" rel="noreferrer">View team page</Link>
      </header>

      <form action={action} className="te-form" onInvalidCapture={(event) => {
        const key = (event.target as HTMLElement).closest("details[data-contact-key]")?.getAttribute("data-contact-key");
        if (key) setExpandedContact(key);
      }}>
        <fieldset className="te-fieldset" disabled={pending}>
          <div className="te-settings">
            <section className="te-section" aria-labelledby="te-page-title">
              <div className="te-section-heading"><h2 id="te-page-title">Page content</h2></div>
              <div className="te-section-body">
                <label className="field">Page title
                  <input name="title" value={page.title} onChange={(event) => setPage((value) => ({ ...value, title: event.target.value }))} required />
                </label>
                <label className="field">Subtitle
                  <textarea name="subtitle" rows={3} value={page.subtitle} onChange={(event) => setPage((value) => ({ ...value, subtitle: event.target.value }))} />
                </label>
                <div className="te-page-preview" aria-label="Page heading preview">
                  <strong>{page.title || "Page title"}</strong>
                  {page.subtitle ? <p>{page.subtitle}</p> : null}
                </div>
                <details className="te-cta">
                  <summary>Page footer link <ChevronDown size={14} aria-hidden="true" /></summary>
                  <div className="te-fields">
                    <label className="field te-full">Supporting text
                      <input name="ctaText" value={page.ctaText} onChange={(event) => setPage((value) => ({ ...value, ctaText: event.target.value }))} />
                    </label>
                    <label className="field">Link label
                      <input name="ctaLabel" value={page.ctaLabel} onChange={(event) => setPage((value) => ({ ...value, ctaLabel: event.target.value }))} />
                    </label>
                    <label className="field">Link destination
                      <input name="ctaHref" value={page.ctaHref} onChange={(event) => setPage((value) => ({ ...value, ctaHref: event.target.value }))} />
                    </label>
                  </div>
                </details>
              </div>
            </section>

            <section className="te-section" aria-labelledby="te-departments-title">
              <div className="te-section-heading">
                <h2 id="te-departments-title">Departments</h2>
                <button className="button-muted" type="button" onClick={() => setDepartments((items) => [...items, { id: crypto.randomUUID(), name: "" }])}>
                  <Plus size={14} aria-hidden="true" /> Add department
                </button>
              </div>
              <input type="hidden" name="department_count" value={departments.length} />
              <div className="te-departments">
                {departments.map((department, index) => {
                  const count = regions.filter((region) => region.departmentId === department.id).length;
                  const blocked = departments.length === 1 || count > 0;
                  return (
                    <div className="te-department" key={department.id}>
                      <input type="hidden" name={`department_${index}_id`} value={department.id} />
                      <label className="field">
                        <span className="te-sr-only">Department name {index + 1}</span>
                        <input name={`department_${index}_name`} value={department.name} required placeholder="Department name"
                          onChange={(event) => setDepartments((items) => items.map((item) => item.id === department.id ? { ...item, name: event.target.value } : item))} />
                      </label>
                      <span className="te-count">{count} {count === 1 ? "contact" : "contacts"}</span>
                      <button className="te-text-button" type="button" aria-label={`Remove ${department.name || "department"}`} disabled={blocked}
                        title={count ? "Reassign this department's contacts before removing it." : departments.length === 1 ? "Keep at least one department." : "Remove department"}
                        onClick={() => setDepartments((items) => items.filter((item) => item.id !== department.id))}>Remove</button>
                    </div>
                  );
                })}
              </div>
              <p className="te-help">Reassign contacts before removing their department.</p>
            </section>
          </div>

          <section className="te-section te-contacts" aria-labelledby="te-contacts-title">
            <div className="te-section-heading">
              <h2 id="te-contacts-title">Contacts <span>{regions.length}</span></h2>
              <button className="button-muted" type="button" disabled={!departments.length} onClick={addContact}>
                <Plus size={14} aria-hidden="true" /> Add contact
              </button>
            </div>
            <input type="hidden" name="contact_count" value={regions.length} />
            {!regions.length ? <div className="te-empty">No contacts yet. Add a contact and choose their department.</div> : null}
            <div className="te-contact-list">
              {regions.map((region, index) => (
                <details className="te-contact" key={region.formKey} data-contact-key={region.formKey} open={expandedContact === region.formKey}>
                  <summary onClick={(event) => { event.preventDefault(); setExpandedContact(expandedContact === region.formKey ? null : region.formKey); }}>
                    <span className="te-avatar" aria-hidden="true">
                      {region.photoUrl ? <img src={optimizedImageUrl(region.photoUrl, { width: 96, height: 96, quality: 82 })} alt="" />
                        : region.contactName.split(/\s+/).map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "—"}
                    </span>
                    <span className="te-person"><strong>{region.contactName || "New contact"}</strong><span>{region.role || region.email || "Add contact details"}</span></span>
                    <span className="te-contact-department">{departments.find((department) => department.id === region.departmentId)?.name || "Select department"}</span>
                    <span className={`te-visibility${region.enabled ? " is-visible" : ""}`}>{region.enabled ? "Visible" : "Hidden"}</span>
                    <ChevronDown className="te-chevron" size={16} aria-hidden="true" />
                  </summary>
                  <div className="te-contact-body">
                    <div className="te-fields">
                      <label className="field">Contact name
                        <input name={`contact_${index}_contactName`} value={region.contactName} onChange={(event) => updateRegion(region.formKey, { contactName: event.target.value })} required />
                      </label>
                      <label className="field">Designation / Role
                        <input name={`contact_${index}_role`} value={region.role} onChange={(event) => updateRegion(region.formKey, { role: event.target.value })} />
                      </label>
                      <label className="field">Department
                        <select name={`contact_${index}_departmentId`} value={region.departmentId} required onChange={(event) => updateRegion(region.formKey, { departmentId: event.target.value })}>
                          <option value="" disabled>Select department</option>
                          {departments.map((department) => <option key={department.id} value={department.id}>{department.name || "Unnamed department"}</option>)}
                        </select>
                      </label>
                      <label className="field">Display order
                        <input name={`contact_${index}_displayOrder`} type="number" min="1" value={region.displayOrder} onChange={(event) => updateRegion(region.formKey, { displayOrder: Number(event.target.value) })} />
                      </label>
                      <label className="field">Region / Market
                        <input name={`contact_${index}_regionTitle`} value={region.regionTitle} onChange={(event) => updateRegion(region.formKey, { regionTitle: event.target.value })} />
                      </label>
                      <label className="field">Location
                        <input name={`contact_${index}_location`} value={region.location} onChange={(event) => updateRegion(region.formKey, { location: event.target.value })} />
                      </label>
                      <label className="field">Email address
                        <input name={`contact_${index}_email`} type="email" value={region.email} onChange={(event) => updateRegion(region.formKey, { email: event.target.value })} />
                      </label>
                      <label className="field">WhatsApp number
                        <input name={`contact_${index}_whatsapp`} type="tel" value={region.whatsapp} onChange={(event) => updateRegion(region.formKey, { whatsapp: event.target.value })} />
                      </label>
                      <div className="te-full">
                        <MediaField label="Contact photo" inputName={`contact_${index}_photoUrl`} fileName={`contact_${index}_photoFile`}
                          accept="image/png,image/jpeg,image/webp" value={region.photoUrl} onChange={(photoUrl) => updateRegion(region.formKey, { photoUrl })}
                          library={mediaLibrary} helper="Upload a portrait or choose one from the media library." />
                      </div>
                    </div>
                    <div className="te-contact-footer">
                      <label className="te-checkbox"><input name={`contact_${index}_enabled`} type="checkbox" checked={region.enabled} onChange={(event) => updateRegion(region.formKey, { enabled: event.target.checked })} /> Visible on website</label>
                      <button className="te-text-button te-remove" type="button" onClick={() => {
                        if (window.confirm(`Remove ${region.contactName || "this contact"}? Save and publish to apply the removal.`)) {
                          setRegions((items) => items.filter((item) => item.formKey !== region.formKey));
                          setExpandedContact(null);
                        }
                      }}>Remove contact</button>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </section>
        </fieldset>

        <footer className="te-save-bar">
          <div className="te-save-feedback"><ActionMessage state={state} /></div>
          <div className="te-save-actions">
            <button className="admin-btn admin-btn--secondary" type="submit" name="intent" value="draft" disabled={pending}>{pending ? "Saving…" : "Save draft"}</button>
            <button className="admin-btn admin-btn--primary" type="submit" name="intent" value="publish" disabled={pending}>{pending ? "Saving…" : "Save & publish"}</button>
          </div>
        </footer>
      </form>
    </div>
  );
}
