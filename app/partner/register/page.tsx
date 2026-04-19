export default function PartnerRegisterPage() {
  return (
    <main className="shell section">
      <div className="panel">
        <p className="eyebrow">Partner Registration</p>
        <h1 className="section-title">Apply for partner access.</h1>
        <div className="form-grid">
          <label className="field">
            Agency Name
            <input placeholder="Agency or company name" />
          </label>
          <label className="field">
            Contact Name
            <input placeholder="Primary contact" />
          </label>
          <label className="field">
            Business Email
            <input type="email" placeholder="name@agency.com" />
          </label>
          <label className="field">
            Market
            <input placeholder="Country or region" />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            Notes
            <textarea placeholder="Tell us about your market and partner requirements." />
          </label>
        </div>
      </div>
    </main>
  );
}
