export default function PartnerLoginPage() {
  return (
    <main className="shell section">
      <div className="panel">
        <p className="eyebrow">Partner Login</p>
        <h1 className="section-title">Access protected trade content.</h1>
        <div className="form-grid">
          <label className="field">
            Email
            <input type="email" placeholder="partner@agency.com" />
          </label>
          <label className="field">
            Password
            <input type="password" placeholder="Enter your password" />
          </label>
        </div>
      </div>
    </main>
  );
}
