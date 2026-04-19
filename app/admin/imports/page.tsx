export default function AdminImportsPage() {
  return (
    <section>
      <p className="eyebrow">AI Import Center</p>
      <h1 className="section-title">Upload source files, extract content, review before publish.</h1>
      <div className="grid">
        <article className="panel">
          <h2>Import batch upload</h2>
          <p className="muted">
            Accept PDFs, ZIPs, or curated source files for OpenAI-assisted extraction into staging.
          </p>
        </article>
        <article className="panel">
          <h2>Review queue</h2>
          <p className="muted">
            Staging records remain draft-only until a content manager reviews and publishes them.
          </p>
        </article>
        <article className="panel">
          <h2>SEO generation</h2>
          <p className="muted">
            Generate draft resort and room summaries while keeping approval fully manual.
          </p>
        </article>
      </div>
    </section>
  );
}
