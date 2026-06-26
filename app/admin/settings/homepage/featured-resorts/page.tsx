import Link from "next/link";

import {
  addHomepageFeaturedResortAction,
  moveHomepageFeaturedResortAction,
  removeHomepageFeaturedResortAction
} from "@/app/admin/settings/homepage/featured-resorts/actions";
import { getHomepageFeaturedResortsSetting } from "@/lib/site-content";
import { listAdminResortCards, type ResortRecord } from "@/lib/services/resort-service";

function resortWarnings(resort?: ResortRecord) {
  if (!resort) {
    return ["Selected resort no longer exists."];
  }

  const warnings: string[] = [];
  if (resort.status !== "published") warnings.push("Not published");
  if (!resort.heroImageUrl) warnings.push("Missing hero image");
  if (!resort.category) warnings.push("Missing category");
  if (!resort.location) warnings.push("Missing atoll");
  return warnings;
}

export default async function AdminHomepageFeaturedResortsPage() {
  const [{ content: featuredItems }, resorts] = await Promise.all([
    getHomepageFeaturedResortsSetting("draft"),
    listAdminResortCards("resort", 1000)
  ]);

  const resortMap = new Map(resorts.map((resort) => [resort.id, resort]));
  const selectedIds = new Set(featuredItems.map((item) => item.resortId));
  const selected = featuredItems.map((item) => ({
    ...item,
    resort: resortMap.get(item.resortId)
  }));
  const eligibleResorts = resorts
    .filter((resort) => resort.status === "published" && !selectedIds.has(resort.id))
    .sort((left, right) => left.name.localeCompare(right.name));
  const canAdd = featuredItems.length < 5 && eligibleResorts.length > 0;

  return (
    <div className="stack">
      <section>
        <p className="eyebrow">Homepage</p>
        <h1 className="section-title">Homepage Featured Resorts</h1>
        <p className="admin-page-lede">
          Curate the five resorts shown in the homepage Featured Retreats section. Only published resorts are eligible
          for the public homepage.
        </p>
      </section>

      <section className="panel stack">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Add Resort</p>
            <h2>Select one published resort to add to the featured list.</h2>
          </div>
          <span className="badge">{featuredItems.length}/5 selected</span>
        </div>
        <form action={addHomepageFeaturedResortAction} className="form-grid">
          <label className="field" style={{ gridColumn: "1 / -1" }}>
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
                <option key={resort.id} value={resort.id}>
                  {resort.name} {resort.location ? `· ${resort.location}` : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="admin-form-actions" style={{ gridColumn: "1 / -1" }}>
            <button className="admin-btn admin-btn--primary" type="submit" disabled={!canAdd}>
              Add to Homepage
            </button>
          </div>
        </form>
      </section>

      <section className="panel stack">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Current Order</p>
            <h2>These resorts feed the homepage in this order.</h2>
          </div>
          <Link className="button-muted" href="/admin/settings/homepage">
            Back to Homepage Settings
          </Link>
        </div>

        {selected.length ? (
          <div className="admin-table-shell">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Resort</th>
                  <th>Status</th>
                  <th>Warnings</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {selected.map((item, index) => {
                  const warnings = resortWarnings(item.resort);
                  return (
                    <tr key={item.resortId}>
                      <td>{index + 1}</td>
                      <td>
                        <strong>{item.resort?.name ?? "Missing resort"}</strong>
                        <br />
                        <small>{[item.resort?.location, item.resort?.category].filter(Boolean).join(" · ") || "No atoll/category"}</small>
                      </td>
                      <td>
                        <span className="badge">{item.resort?.status ?? "missing"}</span>
                      </td>
                      <td>
                        {warnings.length ? (
                          <div className="admin-resource-chip-list">
                            {warnings.map((warning) => (
                              <span className="admin-resource-chip" key={warning}>{warning}</span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-soft)" }}>Ready</span>
                        )}
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <form action={moveHomepageFeaturedResortAction}>
                            <input type="hidden" name="resortId" value={item.resortId} />
                            <input type="hidden" name="direction" value="up" />
                            <button className="admin-icon-button" type="submit" disabled={index === 0} aria-label={`Move ${item.resort?.name ?? "resort"} up`}>
                              ↑
                            </button>
                          </form>
                          <form action={moveHomepageFeaturedResortAction}>
                            <input type="hidden" name="resortId" value={item.resortId} />
                            <input type="hidden" name="direction" value="down" />
                            <button className="admin-icon-button" type="submit" disabled={index === selected.length - 1} aria-label={`Move ${item.resort?.name ?? "resort"} down`}>
                              ↓
                            </button>
                          </form>
                          <form action={removeHomepageFeaturedResortAction}>
                            <input type="hidden" name="resortId" value={item.resortId} />
                            <button className="admin-btn admin-btn--danger" type="submit">
                              Remove
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-panel">
            <strong>No homepage featured resorts selected yet.</strong>
            <p>The homepage will keep using the legacy published featured resorts until this list is saved.</p>
          </div>
        )}
      </section>
    </div>
  );
}
