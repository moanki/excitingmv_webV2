export default function AdminSettingsPage() {
  return (
    <section>
      <p className="eyebrow">Site Settings</p>
      <h1 className="section-title">Manage notification routes and business configuration.</h1>
      <div className="form-grid">
        <label className="field">
          Notification Email
          <input placeholder="partners@excitingmaldives.com" />
        </label>
        <label className="field">
          Samoa URL
          <input placeholder="https://samoa.example.com" />
        </label>
      </div>
    </section>
  );
}
