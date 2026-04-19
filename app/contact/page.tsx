export default function ContactPage() {
  return (
    <main className="shell section">
      <div className="panel">
        <p className="eyebrow">Contact</p>
        <h1 className="section-title">Talk to the Exciting Maldives team.</h1>
        <div className="form-grid">
          <label className="field">
            Name
            <input placeholder="Your full name" />
          </label>
          <label className="field">
            Email
            <input type="email" placeholder="you@agency.com" />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            Message
            <textarea placeholder="Tell us how we can help." />
          </label>
        </div>
      </div>
    </main>
  );
}
