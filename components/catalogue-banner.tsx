import { optimizedImageUrl } from "@/lib/image-urls";
import type { CatalogueContent } from "@/lib/site-content";

type CatalogueBannerProps = {
  activeKind: "resort" | "hotels" | "liveaboards";
  catalogue: CatalogueContent;
};

const fallbackEyebrows = {
  resort: "Our Resort Portfolio",
  hotels: "Our Hotels",
  liveaboards: "Our Liveaboards"
};

export function CatalogueBanner({ activeKind, catalogue }: CatalogueBannerProps) {
  return (
    <div className={`catalogue-banner-shell portfolio-page portfolio-page--resort portfolio-page--${activeKind}`}>
      <section className="destination-hero portfolio-hero catalogue-banner">
        <div
          className="destination-hero__image"
          style={catalogue.heroImageUrl ? {
            backgroundImage: `url(${optimizedImageUrl(catalogue.heroImageUrl, { width: 2200, height: 1100, quality: 94 })})`
          } : undefined}
          aria-hidden="true"
        />
        <div className="site-container destination-hero__content">
          <div className="destination-hero__copy">
            <p className="lux-eyebrow">{catalogue.eyebrow || fallbackEyebrows[activeKind]}</p>
            <h1>{catalogue.title}</h1>
            <span className="destination-title-rule" aria-hidden="true" />
            <p>{catalogue.body}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
