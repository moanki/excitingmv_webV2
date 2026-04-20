import { updatePartnerStatusAction } from "@/app/admin/partners/actions";
import { listPartnerRequests } from "@/lib/services/partner-service";

export default async function AdminPartnersPage() {
  const partners = await listPartnerRequests();

  return (
    <section className="stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Partner Approvals</p>
          <h1 className="section-title">Review registrations, update status, and export the queue.</h1>
        </div>
        <a className="button-muted" href="/api/admin/partners/export">
          Download CSV
        </a>
      </div>
      <div className="stack">
        {partners.map((partner) => (
          <article key={partner.id} className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{partner.market}</p>
                <h2>{partner.agencyName}</h2>
                <p className="muted">
                  {partner.contactName} • {partner.email}
                </p>
              </div>
              <span className="badge">{partner.status}</span>
            </div>
            <form action={updatePartnerStatusAction} className="stack">
              <input type="hidden" name="id" value={partner.id} />
              <div className="form-grid">
                <label className="field">
                  Status
                  <select name="status" defaultValue={partner.status}>
                    <option value="pending">New</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </label>
                <label className="field" style={{ gridColumn: "1 / -1" }}>
                  Notes
                  <textarea name="notes" defaultValue={partner.notes} />
                </label>
              </div>
              <button className="button" type="submit">
                Save Partner Status
              </button>
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}
