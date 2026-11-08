"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Copy, ExternalLink, Plus, Trash2 } from "lucide-react";
import { MediaField, type MediaLibraryItem } from "@/components/media-field";
import { type OpeningResort, type UpcomingPageContent } from "@/lib/upcoming-resorts";
import { saveCalendarAction } from "./actions";

function Field({ label, value, onChange, multiline = false, type = "text", hint, required = false }: {
  label: string; value: string; onChange: (value: string) => void; multiline?: boolean; type?: string; hint?: string; required?: boolean;
}) {
  return <label className="cal-field"><span>{label}{required && " *"}</span>
    {multiline ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} maxLength={3000} required={required} />
      : <input type={type} value={value} onChange={(e) => onChange(e.target.value)} maxLength={type === "url" ? 2048 : 180} required={required} />}
    {hint && <small>{hint}</small>}</label>;
}

function move<T>(items: T[], index: number, offset: number) {
  const next = [...items];
  [next[index], next[index + offset]] = [next[index + offset], next[index]];
  return next;
}

export function CalendarEditor({ initial, revision, library }: { initial: UpcomingPageContent; revision: string; library: MediaLibraryItem[] }) {
  const [content, setContent] = useState(initial);
  const [tab, setTab] = useState("resorts");
  const [selected, setSelected] = useState(initial.resorts[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [removeId, setRemoveId] = useState("");
  const [savedJson, setSavedJson] = useState(JSON.stringify(initial));
  const submitted = useRef(savedJson);
  const [result, action, pending] = useActionState(saveCalendarAction, { revision });
  const json = JSON.stringify(content);
  const dirty = json !== savedJson;
  const resort = content.resorts.find((r) => r.id === selected);
  const position = content.resorts.findIndex((r) => r.id === selected);

  useEffect(() => {
    if (result.message) setSavedJson(submitted.current);
  }, [result]);
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  function update<K extends keyof UpcomingPageContent>(key: K, value: UpcomingPageContent[K]) {
    setContent((c) => ({ ...c, [key]: value }));
  }
  function updateResort<K extends keyof OpeningResort>(key: K, value: OpeningResort[K]) {
    update("resorts", content.resorts.map((r) => r.id === selected ? { ...r, [key]: value } : r));
  }
  function pageField(key: keyof UpcomingPageContent, label: string, multiline = false, hint?: string) {
    return <Field key={key} label={label} value={String(content[key])} multiline={multiline} hint={hint} onChange={(value) => update(key, value)} />;
  }
  function resortField(key: keyof OpeningResort, label: string, multiline = false, type = "text", hint?: string) {
    return resort && <Field label={label} value={String(resort[key] ?? "")} multiline={multiline} type={type} hint={hint} onChange={(v) => updateResort(key, v)} />;
  }
  function addResort(duplicate?: OpeningResort) {
    const id = crypto.randomUUID();
    const item: OpeningResort = duplicate ? { ...duplicate, id, name: `${duplicate.name} (copy)`, enabled: false } : {
      id, sectionId: content.sections[0].id, name: "Untitled resort", atoll: "", operator: "", openingYear: null,
      launchDate: "", dateLabel: "To be announced", status: "In development", dateMoved: false, note: "", highlights: "",
      keyCount: null, keysLabel: "", imageUrl: "", imageAlt: "", imageCaption: "", officialUrl: "", sourceUrl: "", checkedOn: "", enabled: false
    };
    update("resorts", [...content.resorts, item]);
    setSelected(id); setQuery(""); setTab("resorts");
  }
  const statusOptions = [...new Set(["In development", "Under construction", "Confirmed", "Opening soon", "Open", "On hold", ...content.resorts.map((r) => r.status)])];

  return <section className="calendar-editor">
    <form action={action} onSubmit={() => { submitted.current = json; }}>
      <input type="hidden" name="content" value={json} />
      <input type="hidden" name="revision" value={result.revision} />
      <header className="cal-toolbar">
        <div><h1>Upcoming resorts</h1><p>{dirty ? "You have unsaved changes" : "All changes saved"} · {content.resorts.length} resorts</p></div>
        <div className="cal-toolbar__actions"><Link href="/upcoming-resorts" target="_blank">View published page <ExternalLink size={14} /></Link>
          <button type="submit" name="intent" value="draft" disabled={pending}>{pending ? "Saving…" : "Save draft"}</button>
          <button type="submit" name="intent" value="publish" className="cal-primary" disabled={pending}>Publish changes</button></div>
      </header>
      {result.error && <div className="cal-feedback is-error" role="alert">{result.error}</div>}
      {result.message && !dirty && <div className="cal-feedback" role="status">{result.message}</div>}
      <div className="cal-intro">Edit the page here. Save a draft to keep changes private, or publish when ready. Dates are opening targets unless officially confirmed.</div>
      <div className="cal-tabs" role="tablist" aria-label="Calendar settings">{[
        ["resorts", "Resort openings"], ["page", "Banner & introduction"], ["years", "Years & statistics"], ["copy", "Labels & guidance"], ["seo", "Page settings"]
      ].map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} aria-controls={`cal-${id}`} id={`tab-${id}`} onClick={() => setTab(id)}>{label}</button>)}</div>
      <fieldset disabled={pending} className="cal-content" id={`cal-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === "resorts" && <div className="cal-workspace">
          <aside className="cal-list"><div className="cal-list__top"><h2>Resort openings</h2><button type="button" onClick={() => addResort()}><Plus size={15} /> Add resort</button></div>
            <label className="cal-search"><span>Find a resort</span><input value={query} placeholder="Search name or atoll" onChange={(e) => setQuery(e.target.value)} type="search" /></label>
            <div className="cal-list__rows">{content.resorts.filter((r) => `${r.name} ${r.atoll}`.toLowerCase().includes(query.toLowerCase())).map((r) => <button type="button" key={r.id} className={selected === r.id ? "is-selected" : ""} onClick={() => { setSelected(r.id); setRemoveId(""); }}>
              <strong>{r.name}</strong><span>{r.dateLabel} · {r.status}</span><small>{r.enabled ? "Visible" : "Hidden"}</small></button>)}
              {!content.resorts.length && <p>No resorts yet. Add your first opening above.</p>}
              {!!content.resorts.length && !content.resorts.some((r) => `${r.name} ${r.atoll}`.toLowerCase().includes(query.toLowerCase())) && <p>No resorts match your search.</p>}</div>
          </aside>
          <div className="cal-detail">{resort ? <>
            <header className="cal-detail__header"><div><h2>{resort.name}</h2><label className="cal-toggle"><input type="checkbox" checked={resort.enabled} onChange={(e) => updateResort("enabled", e.target.checked)} /> Show on the page</label></div>
              <div className="cal-icon-actions"><button type="button" aria-label="Move resort up" title="Move up" disabled={position === 0} onClick={() => update("resorts", move(content.resorts, position, -1))}><ArrowUp size={16} /></button><button type="button" aria-label="Move resort down" title="Move down" disabled={position === content.resorts.length - 1} onClick={() => update("resorts", move(content.resorts, position, 1))}><ArrowDown size={16} /></button><button type="button" aria-label="Duplicate resort" title="Duplicate" onClick={() => addResort(resort)}><Copy size={16} /></button></div>
            </header>
            <div className="cal-section"><h3>At a glance</h3><div className="cal-grid">
              {resortField("name", "Resort name")}{resortField("atoll", "Atoll")}{resortField("operator", "Operator / developer")}
              <label className="cal-field"><span>Year section</span><select value={resort.sectionId} onChange={(e) => updateResort("sectionId", e.target.value)}>{content.sections.map((s) => <option key={s.id} value={s.id}>{s.title}{s.enabled ? "" : " (hidden)"}</option>)}</select></label>
              <div className="cal-wide">{resortField("highlights", "Highlights", true, "text", "Keep this short: two or three key features. Line breaks are preserved.")}</div>
            </div></div>
            <div className="cal-section"><h3>Opening date & status</h3><div className="cal-grid">
              <Field label="Opening year" type="number" value={String(resort.openingYear ?? "")} onChange={(v) => updateResort("openingYear", v ? Number(v) : null)} hint="Leave blank when not announced." />
              {resortField("launchDate", "Exact launch date (optional)", false, "date", "Only set a day if officially announced.")}
              {resortField("dateLabel", "Date shown on page", false, "text", "For example: Q4 2027, Late 2028, or To be announced.")}
              <label className="cal-field"><span>Status</span><input list="opening-statuses" value={resort.status} onChange={(e) => updateResort("status", e.target.value)} maxLength={180} /><small>Choose a suggestion or type your own.</small><datalist id="opening-statuses">{statusOptions.map((s) => <option key={s} value={s} />)}</datalist></label>
              <label className="cal-toggle"><input type="checkbox" checked={resort.dateMoved} onChange={(e) => updateResort("dateMoved", e.target.checked)} /> Opening date has moved</label>
              {resortField("note", "Date / status note", true)}
              <Field label="Number of keys" type="number" value={String(resort.keyCount ?? "")} onChange={(v) => updateResort("keyCount", v ? Number(v) : null)} hint="Used for the automatic keys statistic." />
              {resortField("keysLabel", "Keys shown on card", false, "text", "For example: ~120, 54, or Not announced.")}
            </div></div>
            <div className="cal-section"><h3>Resort image</h3>
              <MediaField key={resort.id} label="Resort image" inputName={`image-${resort.id}`} fileName={`file-${resort.id}`} accept="image/jpeg,image/png,image/webp" value={resort.imageUrl} library={library} onChange={(v) => updateResort("imageUrl", v)} folder="media-library/resorts" />
              <div className="cal-grid">{resortField("imageAlt", "Image description (accessibility)")}{resortField("imageCaption", "Photo / render credit")}</div>
            </div>
            <div className="cal-section"><h3>Official website & verified source</h3><p>Each non-empty URL appears as a labelled link and a visible address on the public card.</p>
              {resortField("officialUrl", "Official website URL", false, "url")}{resortField("sourceUrl", "Verified source URL", false, "url")}{resortField("checkedOn", "Source checked on", false, "date")}
            </div>
            <div className="cal-delete">{removeId === resort.id ? <><p>Remove {resort.name}? This takes effect after saving. You can hide it instead.</p><button type="button" className="cal-danger" onClick={() => { update("resorts", content.resorts.filter((r) => r.id !== resort.id)); setSelected(content.resorts.find((r) => r.id !== resort.id)?.id ?? ""); setRemoveId(""); }}>Remove resort</button><button type="button" onClick={() => setRemoveId("")}>Keep resort</button></> : <button type="button" onClick={() => setRemoveId(resort.id)}><Trash2 size={15} /> Remove resort</button>}</div>
          </> : <p>Select a resort or add a new opening to start editing.</p>}</div>
        </div>}
        {tab === "page" && <div className="cal-settings"><h2>Banner & introduction</h2><div className="cal-grid">
          {pageField("eyebrow", "Opening label")}{pageField("title", "Main heading")}{pageField("subtitle", "Year range / second line")}
          <div className="cal-wide">{pageField("description", "Introduction", true)}</div>
          <div className="cal-wide"><MediaField label="Banner image" inputName="bannerUrl" fileName="bannerFile" accept="image/jpeg,image/png,image/webp" value={content.bannerUrl} library={library} onChange={(v) => update("bannerUrl", v)} folder="media-library/general" /></div>
          {pageField("bannerAlt", "Banner description (accessibility)")}{pageField("bannerCaption", "Banner photo credit")}
        </div></div>}
        {tab === "years" && <div className="cal-settings"><h2>Years & sections</h2><p>Sections appear in this order. Resort order is controlled with the up and down buttons in Resort openings.</p>
          {content.sections.map((s, i) => <div className="cal-section" key={s.id}><div className="cal-section__tools"><h3>{s.title}</h3><button type="button" disabled={i === 0} aria-label={`Move ${s.title} up`} onClick={() => update("sections", move(content.sections, i, -1))}><ArrowUp size={15} /></button><button type="button" disabled={i === content.sections.length - 1} aria-label={`Move ${s.title} down`} onClick={() => update("sections", move(content.sections, i, 1))}><ArrowDown size={15} /></button><button type="button" disabled={content.sections.length === 1 || content.resorts.some((r) => r.sectionId === s.id)} title="Move assigned resorts to another section before removing" onClick={() => update("sections", content.sections.filter((x) => x.id !== s.id))}>Remove</button></div>
            <div className="cal-grid">{([ ["title", "Year / section title"], ["description", "Section introduction"], ["jumpLabel", "Jump button text"] ] as const).map(([key, label]) => <Field key={key} label={label} value={s[key]} onChange={(v) => update("sections", content.sections.map((x) => x.id === s.id ? { ...x, [key]: v } : x))} />)}</div><label className="cal-toggle"><input type="checkbox" checked={s.enabled} onChange={(e) => update("sections", content.sections.map((x) => x.id === s.id ? { ...x, enabled: e.target.checked } : x))} /> Show section and its resorts</label>
          </div>)}
          <button type="button" onClick={() => update("sections", [...content.sections, { id: crypto.randomUUID(), title: "New year", description: "", jumpLabel: "", enabled: true }])}><Plus size={15} /> Add year section</button>
          <h2 className="cal-subheading">Statistics</h2><p>Figures calculate from visible resorts unless you enter a display override. Key totals include announced numbers only.</p>
          {content.stats.map((s, i) => <div className="cal-stat" key={s.id}><Field label="Label" value={s.label} onChange={(v) => update("stats", content.stats.map((x) => x.id === s.id ? { ...x, label: v } : x))} /><label className="cal-field"><span>Calculate from</span><select value={s.metric} onChange={(e) => update("stats", content.stats.map((x) => x.id === s.id ? { ...x, metric: e.target.value as typeof s.metric } : x))}>{["openings", "atolls", "keys", "moved", "custom"].map((v) => <option key={v} value={v}>{v}</option>)}</select></label><Field label="Display override" value={s.value} onChange={(v) => update("stats", content.stats.map((x) => x.id === s.id ? { ...x, value: v } : x))} /><div className="cal-icon-actions"><button type="button" aria-label="Move statistic up" disabled={i === 0} onClick={() => update("stats", move(content.stats, i, -1))}><ArrowUp size={15} /></button><button type="button" onClick={() => update("stats", content.stats.filter((x) => x.id !== s.id))} aria-label="Remove statistic"><Trash2 size={15} /></button></div></div>)}
          <button type="button" disabled={content.stats.length >= 6} onClick={() => update("stats", [...content.stats, { id: crypto.randomUUID(), label: "New statistic", metric: "custom", value: "" }])}><Plus size={15} /> Add statistic</button>
        </div>}
        {tab === "copy" && <div className="cal-settings"><h2>Page labels</h2><div className="cal-grid">{[
          ["jumpLabel", "Jump navigation label"], ["askLabel", "Ask our team link text"], ["officialLabel", "Official website label"], ["sourceLabel", "Verified source label"], ["dateMovedLabel", "Date moved badge"], ["checkedLabel", "Source checked label"], ["keysUnit", "Keys unit"], ["emptyMessage", "No openings message"]
        ].map(([key, label]) => pageField(key as keyof UpcomingPageContent, label))}</div><p>All team links lead to the existing <Link href="/team" target="_blank">Team page</Link>, managed in Team settings.</p>
          <h2 className="cal-subheading">Guidance & team invitation</h2><div className="cal-grid">{pageField("guidanceTitle", "Guidance heading")}{pageField("ctaTitle", "Team invitation heading")}{pageField("guidanceBody", "Guidance text", true)}{pageField("ctaBody", "Team invitation text", true)}{pageField("ctaLabel", "Team button text")}<div className="cal-wide">{pageField("disclaimer", "Opening date disclaimer", true)}</div></div>
        </div>}
        {tab === "seo" && <div className="cal-settings"><h2>Page settings</h2><label className="cal-toggle"><input type="checkbox" checked={content.enabled} onChange={(e) => update("enabled", e.target.checked)} /> Enable public calendar page</label><p>Turning this off and publishing hides the calendar. Your content stays saved.</p>{pageField("seoTitle", "Search engine title")}{pageField("seoDescription", "Search engine description", true)}<p>Header, navigation, footer and contact information use the existing <Link href="/admin/settings">Site settings</Link>.</p></div>}
      </fieldset>
    </form>
  </section>;
}
