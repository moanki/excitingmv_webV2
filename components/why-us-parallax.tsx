import type { HomepageStat, HomepageWhyUsItem } from "@/lib/site-content";

type WhyUsParallaxProps = {
  items: HomepageWhyUsItem[];
  images: string[];
  title?: string;
  description?: string;
  proofStats?: HomepageStat[];
};

export function WhyUsParallax({ items, images, title, description, proofStats = [] }: WhyUsParallaxProps) {
  const enabledItems = items.filter((item) => item.title).slice(0, 4);
  const proof = proofStats.slice(0, 4);

  return (
    <div className="why-trust">
      <div className="why-trust__intro">
        <p className="lux-eyebrow">{title || "Why Travel Designers Choose Us"}</p>
        <h2>Local precision for partners who need more than a resort list.</h2>
        {description ? <p>{description}</p> : null}
        {proof.length ? (
          <div className="why-trust__proof" aria-label="Exciting Maldives proof points">
            {proof.map((item) => (
              <span key={`${item.value}-${item.label}`}>
                <strong>{item.value}</strong> {item.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="why-trust__image" style={{ backgroundImage: `url(${images[0]})` }} aria-hidden="true" />

      <div className="why-trust__reasons">
        {enabledItems.map((item, index) => (
          <article className="why-trust__reason" key={item.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
