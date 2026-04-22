import { getHomepageAwardsContent, getFooterContent } from "@/lib/site-content";

export default async function AwardsPage() {
  const [{ content: homepageAwards }, { content: footer }] = await Promise.all([
    getHomepageAwardsContent("published"),
    getFooterContent("published")
  ]);

  const items = [...homepageAwards.items, ...footer.awards].filter((item) => item.enabled && (item.name || item.imageUrl));

  return (
    <main className="shell section">
      <section className="panel stack">
        <div className="stack">
          <p className="eyebrow">Awards</p>
          <h1 className="section-title">{homepageAwards.title || "Recognition and trade credentials."}</h1>
          <p className="muted">
            Published award visuals and proof points now have a real front-end destination, so uploaded
            award assets from admin are visible on the site outside the homepage as well.
          </p>
        </div>

        <div className="grid">
          {items.map((item) => (
            <article key={`${item.name}-${item.imageUrl}`} className="card">
              <span className="badge">Recognition</span>
              <h2>{item.name || "Award badge"}</h2>
              {item.imageUrl ? <img src={item.imageUrl} alt={item.name || "Award"} style={{ borderRadius: "16px" }} /> : null}
              {item.href ? (
                <p>
                  <a href={item.href} target="_blank" rel="noreferrer">
                    Visit source
                  </a>
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
