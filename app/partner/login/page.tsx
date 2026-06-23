export default function PartnerLoginPage() {
  return (
    <>
    <main className="shell section partner-access-page desktop-screen">
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
    <main className="mobile-screen mobile-partner-login">
      <section className="mobile-login-card">
        <div className="mobile-lock-mark" aria-hidden="true" />
        <h1>Partner Portal</h1>
        <p>
          Access exclusive resort intelligence, trade-ready offers, and B2B resources.
          Restricted to verified Exciting Maldives partners.
        </p>
        <label>
          <span>Partner email address</span>
          <input type="email" placeholder="Partner email address" />
        </label>
        <label>
          <span>Password</span>
          <input type="password" placeholder="Password" />
        </label>
        <button type="button">Sign In To Portal</button>
        <a href="/partner/register" className="mobile-forgot-link">Forgot your password?</a>
        <div className="mobile-login-divider" />
        <p className="mobile-apply-text">
          Not a partner yet? <a href="/partner/register">Apply for access</a>
        </p>
      </section>

      <section className="mobile-benefits-card">
        <p className="mobile-eyebrow">What You Get Access To</p>
        {[
          "Protected resort intelligence and sales narratives.",
          "Trade-ready offers and partner support.",
          "Downloadable resources for approved travel professionals.",
          "Priority Maldives destination assistance."
        ].map((benefit) => (
          <div className="mobile-benefit-item" key={benefit}>
            <span />
            <p>{benefit}</p>
          </div>
        ))}
      </section>
    </main>
    </>
  );
}
