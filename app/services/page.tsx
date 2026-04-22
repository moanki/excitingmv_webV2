import {
  getHomepageFeatures,
  getHomepageServices,
  getHomepageWhyUs
} from "@/lib/site-content";

export default async function ServicesPage() {
  const [{ content: services }, { content: highlights }, { content: whyUs }] = await Promise.all([
    getHomepageServices("published"),
    getHomepageFeatures("published"),
    getHomepageWhyUs("published")
  ]);

  return (
    <main className="shell section">
      <section className="panel stack">
        <div className="stack">
          <p className="eyebrow">Services</p>
          <h1 className="section-title">Operational support, contracting, and premium sales enablement.</h1>
          <p className="muted">
            Exciting Maldives supports travel partners with destination knowledge, luxury resort access,
            and on-ground coordination designed for commercially active B2B teams.
          </p>
        </div>

        <div className="grid">
          {services.filter((service) => service.enabled && service.title).map((service) => (
            <article key={service.title} className="card">
              <span className="badge">Service</span>
              <h2>{service.title}</h2>
            </article>
          ))}
        </div>

        <div className="grid">
          {highlights.map((item) => (
            <article key={item.title} className="card">
              <p className="eyebrow">{item.eyebrow}</p>
              <h2>{item.title}</h2>
              <p className="muted">{item.description}</p>
            </article>
          ))}
          {whyUs.map((item) => (
            <article key={item.title} className="card">
              <span className="badge">Why Us</span>
              <h2>{item.title}</h2>
              <p className="muted">{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
