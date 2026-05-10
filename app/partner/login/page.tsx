export default function PartnerLoginPage() {
  return (
    <main className="shell section partner-access-page">
      <div className="panel partner-access-card">
        <p className="eyebrow">Welcome Back</p>
        <h1 className="section-title">Travel Partner</h1>
        <p className="muted">Access protected rates, resort intelligence, and destination support.</p>
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
        <div className="partner-access-actions">
          <button type="button" className="site-button site-button--teal">Login</button>
          <a href="/partner/register" className="site-button site-button--ghost">Register</a>
        </div>
        <ul className="partner-access-benefits">
          <li>Exclusive Rates</li>
          <li>Dedicated Support</li>
          <li>Marketing Assistance</li>
          <li>Global Network Access</li>
        </ul>
        <a href="/#newsletter" className="partner-access-support">Contact Support</a>
      </div>
    </main>
  );
}
