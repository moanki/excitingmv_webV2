import { updatePartnerStatusAction } from "@/app/admin/partners/actions";
import { listPartnerRequests } from "@/lib/services/partner-service";

export default async function AdminPartnersPage() {
  const partners = await listPartnerRequests();

  return (
    <section className="stack">
      <div className="admin-page-header">
        <div className="admin-page-header__content">
          <p className="eyebrow">Partner Approvals</p>
          <h1 className="section-title">Review registrations, update status, and export the queue.</h1>
          <p className="admin-page-lede">Treat this like an approvals queue with faster scanning and calmer forms.</p>
        </div>
        <a className="admin-btn admin-btn--secondary" href="/api/admin/partners/export">
          Download CSV
        </a>
      </div>

      <div className="stack">
        {partners.map((partner) => (
          <article key={partner.id} className="panel admin-record-card">
            <div className="admin-record-card__header">
              <div>
                <p className="eyebrow">{partner.market}</p>
                <h2>{partner.agencyName}</h2>
                <p className="muted">{partner.contactName} • {partner.email}</p>
              </div>
              <span className="badge">{partner.status}</span>
            </div>

            <div className="admin-meta-grid">
              <div>
                <strong>Contact</strong>
                <span>{partner.contactName}</span>
              </div>
              <div>
                <strong>Email</strong>
                <span>{partner.email}</span>
              </div>
              <div>
                <strong>Market</strong>
                <span>{partner.market}</span>
              </div>
            </div>

            <form action={updatePartnerStatusAction} className="stack admin-form-card">
              <input type="hidden" name="id" value={partner.id} />
              <div className="form-grid">
                <label className="field">
                  <span className="field__label">Status</span>
                  <select className="admin-select" name="status" defaultValue={partner.status}>
                    <option value="pending">New</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </label>
                <label className="field field--full">
                  <span className="field__label">Notes</span>
                  <textarea className="admin-textarea" name="notes" defaultValue={partner.notes} />
                </label>
              </div>
              <div className="admin-form-actions">
                <button className="admin-btn admin-btn--primary" type="submit">
                  Save Partner Status
                </button>
              </div>
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}
