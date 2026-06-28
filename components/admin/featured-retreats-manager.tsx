import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

import {
  addHomepageFeaturedResortAction,
  moveHomepageFeaturedResortAction,
  removeHomepageFeaturedResortAction
} from "@/app/admin/settings/homepage/featured-resorts/actions";
import { getHomepageFeaturedResortsSetting } from "@/lib/site-content";
import { listAdminResortCards, type ResortRecord } from "@/lib/services/resort-service";

function resortWarnings(resort?: ResortRecord) {
  if (!resort) return ["Selected resort no longer exists."];

  const warnings: string[] = [];
  if (resort.status !== "published") warnings.push("Not published");
  if (!resort.heroImageUrl) warnings.push("Missing hero image");
  if (!resort.category) warnings.push("Missing category");
  if (!resort.location) warnings.push("Missing atoll");
  return warnings;
}

export async function FeaturedRetreatsManager() {
  const [{ content: featuredItems }, resorts] = await Promise.all([
    getHomepageFeaturedResortsSetting("draft"),
    listAdminResortCards("resort", 1000)
  ]);
  const resortMap = new Map(resorts.map((resort) => [resort.id, resort]));
  const selectedIds = new Set(featuredItems.map((item) => item.resortId));
  const selected = featuredItems.map((item) => ({ ...item, resort: resortMap.get(item.resortId) }));
  const eligibleResorts = resorts
    .filter((resort) => resort.status === "published" && !selectedIds.has(resort.id))
    .sort((left, right) => left.name.localeCompare(right.name));
  const canAdd = featuredItems.length < 5 && eligibleResorts.length > 0;

  return (
    <div className="stack featured-retreats-manager">
      <section className="panel stack">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Selected Resorts</p>
            <h2>Choose up to five published resorts for the homepage.</h2>
          </div>
          <span className="badge">{featuredItems.length}/5 selected</span>
        </div>
        <form action={addHomepageFeaturedResortAction} className="form-grid">
          <label className="field field--full">
            Published resort
            <select className="admin-select" name="resortId" disabled={!canAdd} required>
              <option value="">
                {featuredItems.length >= 5
                  ? "Featured list is full"
                  : eligibleResorts.length
                    ? "Choose a resort"
                    : "No eligible published resorts available"}
              </option>
              {eligibleResorts.map((resort) => (
                <option key={resort.id} value={resort.id}>{resort.name}{resort.location ? ` · ${resort.location}` : ""}</option>
              ))}
            </select>
          </label>
          <div className="admin-form-actions field--full">
            <button className="admin-btn admin-btn--primary" type="submit" disabled={!canAdd}>Add Retreat</button>
          </div>
        </form>
      </section>

      <section className="panel stack">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Display Order</p>
            <h2>Homepage retreats appear in this order.</h2>
          </div>
        </div>
        {selected.length ? (
          <div className="admin-table-shell">
            <table className="table">
              <thead><tr><th>Order</th><th>Resort</th><th>Status</th><th>Warnings</th><th>Actions</th></tr></thead>
              <tbody>
                {selected.map((item, index) => {
                  const warnings = resortWarnings(item.resort);
                  const name = item.resort?.name ?? "Missing resort";
                  return (
                    <tr key={item.resortId}>
                      <td>{index + 1}</td>
                      <td><strong>{name}</strong><br /><small>{[item.resort?.location, item.resort?.category].filter(Boolean).join(" · ") || "No atoll/category"}</small></td>
                      <td><span className="badge">{item.resort?.status ?? "missing"}</span></td>
                      <td>{warnings.length ? <div className="admin-resource-chip-list">{warnings.map((warning) => <span className="admin-resource-chip" key={warning}>{warning}</span>)}</div> : <span className="admin-table-subtle">Ready</span>}</td>
                      <td>
                        <div className="admin-row-actions">
                          <form action={moveHomepageFeaturedResortAction}>
                            <input type="hidden" name="resortId" value={item.resortId} /><input type="hidden" name="direction" value="up" />
                            <button className="admin-icon-button" type="submit" disabled={index === 0} aria-label={`Move ${name} up`}><ChevronUp className="admin-icon" /></button>
                          </form>
                          <form action={moveHomepageFeaturedResortAction}>
                            <input type="hidden" name="resortId" value={item.resortId} /><input type="hidden" name="direction" value="down" />
                            <button className="admin-icon-button" type="submit" disabled={index === selected.length - 1} aria-label={`Move ${name} down`}><ChevronDown className="admin-icon" /></button>
                          </form>
                          <form action={removeHomepageFeaturedResortAction}>
                            <input type="hidden" name="resortId" value={item.resortId} />
                            <button className="admin-icon-button admin-icon-button--danger" type="submit" aria-label={`Remove ${name}`}><Trash2 className="admin-icon" /></button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <div className="admin-empty-panel"><strong>No featured retreats selected yet.</strong><p>Add a published resort above to start the homepage list.</p></div>}
      </section>
    </div>
  );
}
