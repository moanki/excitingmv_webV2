"use client";

import { useActionState, useState } from "react";

import { MediaField, type MediaLibraryItem } from "@/components/media-field";
import {
  publishAboutAction,
  publishAdminLoginAction,
  publishAwardsAction,
  publishCeoAction,
  publishFeaturesAction,
  publishFooterAction,
  publishGuideAction,
  publishHeroAction,
  publishNewsletterContentAction,
  publishMarketAction,
  publishNavbarAction,
  publishNotificationAction,
  publishServicesAction,
  publishStatsAction,
  publishStoryAction,
  publishWhatsAppAction,
  publishWhyUsAction,
  saveAboutDraftAction,
  saveAdminLoginDraftAction,
  saveAwardsDraftAction,
  saveCeoDraftAction,
  saveFeaturesDraftAction,
  saveFooterDraftAction,
  saveGuideDraftAction,
  saveHeroDraftAction,
  saveNewsletterContentDraftAction,
  saveMarketDraftAction,
  saveNavbarDraftAction,
  saveNotificationDraftAction,
  saveServicesDraftAction,
  saveStatsDraftAction,
  saveStoryDraftAction,
  saveWhatsAppDraftAction,
  saveWhyUsDraftAction
} from "@/app/admin/settings/actions";
import type {
  AboutBentoCard,
  AboutLogoItem,
  AboutMarketCard,
  AboutPageContent,
  AboutStatCard,
  AboutWhyPoint,
  AdminLoginContent,
  FooterBadge,
  FooterContent,
  FooterLinkGroup,
  HomepageAwardsContent,
  HomepageCeoContent,
  HomepageFeatureCard,
  HomepageGuideItem,
  HomepageHeroContent,
  HomepageNewsletterContent,
  HomepageServiceItem,
  HomepageStat,
  HomepageStoryContent,
  HomepageWhyUsItem,
  MarketSettings,
  NavbarContent,
  NotificationSettings,
  WhatsAppSettings
} from "@/lib/site-content";

function StatusMessage({ message, error }: { message?: string; error?: string }) {
  if (error) {
    return <p className="auth-error">{error}</p>;
  }

  if (message) {
    return <p className="auth-note">{message}</p>;
  }

  return null;
}

export function AboutSettingsForm({
  about,
  mediaLibrary
}: {
  about: AboutPageContent;
  mediaLibrary: MediaLibraryItem[];
}) {
  const [state, action, pending] = useActionState(saveAboutDraftAction, undefined);
  const [stats, setStats] = useState(about.hero.stats.length ? about.hero.stats : [blankAboutStat()]);
  const [whatCards, setWhatCards] = useState(about.whatWeDo.cards.length ? about.whatWeDo.cards : [blankAboutBento(0)]);
  const [markets, setMarkets] = useState(about.markets.cards.length ? about.markets.cards : [blankAboutMarket(0)]);
  const [whyPoints, setWhyPoints] = useState(about.whyUs.points.length ? about.whyUs.points : [blankAboutWhy(0)]);
  const [logos, setLogos] = useState(about.awards.logos.length ? about.awards.logos : [blankAboutLogo(0)]);

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">About Us</p>
          <h2 className="settings-title">Premium B2B brand confidence page.</h2>
          <p className="admin-page-lede">
            Manage the About page hero, trust story, bento cards, market proof, awards, CTA, and SEO.
          </p>
        </div>
        <form action={publishAboutAction}>
          <button className="button-muted" type="submit">
            Publish Current Draft
          </button>
        </form>
      </div>

      <form action={action} className="stack">
        <details className="panel panel-soft admin-collapsible" open>
          <summary>Hero</summary>
          <div className="form-grid">
            <label className="field">
              Kicker
              <input name="heroKicker" defaultValue={about.hero.kicker} />
            </label>
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              Headline
              <input name="heroHeadline" defaultValue={about.hero.headline} />
            </label>
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              Body text
              <textarea name="heroBody" defaultValue={about.hero.body} />
            </label>
            <label className="field">
              Primary CTA label
              <input name="heroPrimaryCtaLabel" defaultValue={about.hero.primaryCtaLabel} />
            </label>
            <label className="field">
              Primary CTA link
              <input name="heroPrimaryCtaHref" defaultValue={about.hero.primaryCtaHref} />
            </label>
            <label className="field">
              Secondary CTA label
              <input name="heroSecondaryCtaLabel" defaultValue={about.hero.secondaryCtaLabel} />
            </label>
            <label className="field">
              Secondary CTA link
              <input name="heroSecondaryCtaHref" defaultValue={about.hero.secondaryCtaHref} />
            </label>
          </div>
          <MediaField
            label="Hero image"
            inputName="heroImageUrl"
            fileName="aboutHeroImageFile"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            value={about.hero.imageUrl}
            library={mediaLibrary}
          />
          <input type="hidden" name="about_stat_count" value={stats.length} />
          <div className="stack">
            <p className="eyebrow">Hero stat cards</p>
            {stats.map((stat, index) => (
              <div className="panel panel-nested" key={`about-stat-${index}`}>
                <div className="form-grid">
                  <label className="field">
                    Value
                    <input name={`about_stat_${index}_value`} defaultValue={stat.value} />
                  </label>
                  <label className="field">
                    Label
                    <input name={`about_stat_${index}_label`} defaultValue={stat.label} />
                  </label>
                </div>
                <div className="admin-form-actions">
                  <ToggleField name={`about_stat_${index}_enabled`} label="Show stat" defaultChecked={stat.enabled} />
                  <button type="button" className="button-muted" onClick={() => setStats((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
            <button type="button" className="button-muted" onClick={() => setStats((rows) => [...rows, blankAboutStat()])}>
              Add Stat
            </button>
          </div>
        </details>

        <details className="panel panel-soft admin-collapsible">
          <summary>Our Story</summary>
          <div className="form-grid">
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              Section title
              <input name="storyTitle" defaultValue={about.story.title} />
            </label>
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              Story text
              <textarea name="storyBody" defaultValue={about.story.body} />
            </label>
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              Optional second paragraph
              <textarea name="storySecondaryBody" defaultValue={about.story.secondaryBody} />
            </label>
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              Image alt text
              <input name="storyImageAlt" defaultValue={about.story.imageAlt} />
            </label>
          </div>
          <MediaField
            label="Story image"
            inputName="storyImageUrl"
            fileName="aboutStoryImageFile"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            value={about.story.imageUrl}
            library={mediaLibrary}
          />
        </details>

        <details className="panel panel-soft admin-collapsible">
          <summary>What We Do</summary>
          <div className="form-grid">
            <label className="field">
              Section title
              <input name="whatTitle" defaultValue={about.whatWeDo.title} />
            </label>
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              Section subtitle
              <textarea name="whatSubtitle" defaultValue={about.whatWeDo.subtitle} />
            </label>
          </div>
          <input type="hidden" name="about_what_count" value={whatCards.length} />
          {whatCards.map((card, index) => (
            <div className="panel panel-nested" key={`about-what-${index}`}>
              <div className="section-heading compact">
                <p className="eyebrow">{card.title || `Bento Card ${index + 1}`}</p>
                <button type="button" className="button-muted" onClick={() => setWhatCards((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}>
                  Delete
                </button>
              </div>
              <div className="form-grid">
                <label className="field">
                  Icon
                  <input name={`about_what_${index}_icon`} defaultValue={card.icon} />
                </label>
                <label className="field">
                  Sort order
                  <input name={`about_what_${index}_displayOrder`} defaultValue={card.displayOrder} inputMode="numeric" />
                </label>
                <label className="field" style={{ gridColumn: "1 / -1" }}>
                  Title
                  <input name={`about_what_${index}_title`} defaultValue={card.title} />
                </label>
                <label className="field" style={{ gridColumn: "1 / -1" }}>
                  Description
                  <textarea name={`about_what_${index}_description`} defaultValue={card.description} />
                </label>
              </div>
              <ToggleField name={`about_what_${index}_enabled`} label="Show card" defaultChecked={card.enabled} />
            </div>
          ))}
          <button type="button" className="button-muted" onClick={() => setWhatCards((rows) => [...rows, blankAboutBento(rows.length)])}>
            Add Bento Card
          </button>
        </details>

        <details className="panel panel-soft admin-collapsible">
          <summary>Market Expertise</summary>
          <div className="form-grid">
            <label className="field">
              Section title
              <input name="marketsTitle" defaultValue={about.markets.title} />
            </label>
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              Section subtitle
              <textarea name="marketsSubtitle" defaultValue={about.markets.subtitle} />
            </label>
          </div>
          <input type="hidden" name="about_market_count" value={markets.length} />
          {markets.map((market, index) => (
            <div className="panel panel-nested" key={`about-market-${index}`}>
              <div className="section-heading compact">
                <p className="eyebrow">{market.region || `Market ${index + 1}`}</p>
                <button type="button" className="button-muted" onClick={() => setMarkets((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}>
                  Delete
                </button>
              </div>
              <div className="form-grid">
                <label className="field">
                  Icon
                  <input name={`about_market_${index}_icon`} defaultValue={market.icon} />
                </label>
                <label className="field">
                  Sort order
                  <input name={`about_market_${index}_displayOrder`} defaultValue={market.displayOrder} inputMode="numeric" />
                </label>
                <label className="field" style={{ gridColumn: "1 / -1" }}>
                  Region name
                  <input name={`about_market_${index}_region`} defaultValue={market.region} />
                </label>
                <label className="field" style={{ gridColumn: "1 / -1" }}>
                  Description
                  <textarea name={`about_market_${index}_description`} defaultValue={market.description} />
                </label>
              </div>
              <ToggleField name={`about_market_${index}_enabled`} label="Show market" defaultChecked={market.enabled} />
            </div>
          ))}
          <button type="button" className="button-muted" onClick={() => setMarkets((rows) => [...rows, blankAboutMarket(rows.length)])}>
            Add Market
          </button>
        </details>

        <details className="panel panel-soft admin-collapsible">
          <summary>Why Us</summary>
          <div className="form-grid">
            <label className="field">
              Section title
              <input name="whyTitle" defaultValue={about.whyUs.title} />
            </label>
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              Section subtitle
              <textarea name="whySubtitle" defaultValue={about.whyUs.subtitle} />
            </label>
          </div>
          <input type="hidden" name="about_why_count" value={whyPoints.length} />
          {whyPoints.map((point, index) => (
            <div className="panel panel-nested" key={`about-why-${index}`}>
              <div className="section-heading compact">
                <p className="eyebrow">{point.title || `Point ${index + 1}`}</p>
                <button type="button" className="button-muted" onClick={() => setWhyPoints((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}>
                  Delete
                </button>
              </div>
              <div className="form-grid">
                <label className="field">
                  Icon
                  <input name={`about_why_${index}_icon`} defaultValue={point.icon} />
                </label>
                <label className="field">
                  Sort order
                  <input name={`about_why_${index}_displayOrder`} defaultValue={point.displayOrder} inputMode="numeric" />
                </label>
                <label className="field" style={{ gridColumn: "1 / -1" }}>
                  Title
                  <input name={`about_why_${index}_title`} defaultValue={point.title} />
                </label>
                <label className="field" style={{ gridColumn: "1 / -1" }}>
                  Text
                  <textarea name={`about_why_${index}_description`} defaultValue={point.description} />
                </label>
              </div>
              <ToggleField name={`about_why_${index}_enabled`} label="Show point" defaultChecked={point.enabled} />
            </div>
          ))}
          <button type="button" className="button-muted" onClick={() => setWhyPoints((rows) => [...rows, blankAboutWhy(rows.length)])}>
            Add Value Proposition
          </button>
        </details>

        <details className="panel panel-soft admin-collapsible">
          <summary>Awards & Memberships</summary>
          <div className="form-grid">
            <label className="field">
              Section title
              <input name="awardsTitle" defaultValue={about.awards.title} />
            </label>
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              Section subtitle
              <textarea name="awardsSubtitle" defaultValue={about.awards.subtitle} />
            </label>
          </div>
          <input type="hidden" name="about_logo_count" value={logos.length} />
          {logos.map((logo, index) => (
            <div className="panel panel-nested" key={`about-logo-${index}`}>
              <div className="section-heading compact">
                <p className="eyebrow">{logo.name || `Logo ${index + 1}`}</p>
                <button type="button" className="button-muted" onClick={() => setLogos((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}>
                  Delete
                </button>
              </div>
              <div className="form-grid">
                <label className="field">
                  Logo title
                  <input name={`about_logo_${index}_name`} defaultValue={logo.name} />
                </label>
                <label className="field">
                  Optional link
                  <input name={`about_logo_${index}_href`} defaultValue={logo.href} />
                </label>
                <label className="field">
                  Sort order
                  <input name={`about_logo_${index}_displayOrder`} defaultValue={logo.displayOrder} inputMode="numeric" />
                </label>
              </div>
              <MediaField
                label="Logo image"
                inputName={`about_logo_${index}_imageUrl`}
                fileName={`about_logo_${index}_imageFile`}
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                value={logo.imageUrl}
                library={mediaLibrary}
              />
              <ToggleField name={`about_logo_${index}_enabled`} label="Show logo" defaultChecked={logo.enabled} />
            </div>
          ))}
          <button type="button" className="button-muted" onClick={() => setLogos((rows) => [...rows, blankAboutLogo(rows.length)])}>
            Add Logo
          </button>
        </details>

        <details className="panel panel-soft admin-collapsible">
          <summary>Final CTA and SEO</summary>
          <div className="form-grid">
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              CTA headline
              <input name="ctaHeadline" defaultValue={about.cta.headline} />
            </label>
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              CTA body
              <textarea name="ctaBody" defaultValue={about.cta.body} />
            </label>
            <label className="field">
              Primary CTA label
              <input name="ctaPrimaryLabel" defaultValue={about.cta.primaryCtaLabel} />
            </label>
            <label className="field">
              Primary CTA link
              <input name="ctaPrimaryHref" defaultValue={about.cta.primaryCtaHref} />
            </label>
            <label className="field">
              Secondary CTA label
              <input name="ctaSecondaryLabel" defaultValue={about.cta.secondaryCtaLabel} />
            </label>
            <label className="field">
              Secondary CTA link
              <input name="ctaSecondaryHref" defaultValue={about.cta.secondaryCtaHref} />
            </label>
            <label className="field">
              Third CTA label
              <input name="ctaTertiaryLabel" defaultValue={about.cta.tertiaryCtaLabel} />
            </label>
            <label className="field">
              Third CTA link
              <input name="ctaTertiaryHref" defaultValue={about.cta.tertiaryCtaHref} />
            </label>
            <label className="field">
              Background color
              <input name="ctaBackgroundColor" defaultValue={about.cta.backgroundColor} />
            </label>
          </div>
          <MediaField
            label="CTA background image"
            inputName="ctaBackgroundImageUrl"
            fileName="aboutCtaImageFile"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            value={about.cta.backgroundImageUrl}
            library={mediaLibrary}
          />
          <div className="form-grid">
            <label className="field">
              SEO title
              <input name="seoTitle" defaultValue={about.seo.title} />
            </label>
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              Meta description
              <textarea name="seoDescription" defaultValue={about.seo.description} />
            </label>
            <label className="field">
              Canonical URL
              <input name="seoCanonicalUrl" defaultValue={about.seo.canonicalUrl} />
            </label>
          </div>
          <MediaField
            label="Open Graph image"
            inputName="seoOgImageUrl"
            fileName="aboutOgImageFile"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            value={about.seo.ogImageUrl}
            library={mediaLibrary}
          />
        </details>

        <div className="admin-form-actions">
          <button className="button-muted" type="submit" name="intent" value="draft" disabled={pending}>
            {pending ? "Saving..." : "Save About Draft"}
          </button>
          <a className="button-muted" href="/about" target="_blank" rel="noreferrer">
            Preview
          </a>
          <button className="button-primary" type="submit" name="intent" value="publish" disabled={pending}>
            {pending ? "Publishing..." : "Save & Publish About"}
          </button>
        </div>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

export function AdminLoginSettingsForm({
  settings,
  mediaLibrary
}: {
  settings: AdminLoginContent;
  mediaLibrary: MediaLibraryItem[];
}) {
  const [state, action, pending] = useActionState(saveAdminLoginDraftAction, undefined);

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Admin Login Page</p>
          <h2 className="settings-title">Login media and workspace branding.</h2>
          <p className="admin-page-lede">
            Choose the full-page login image and logo shown before users enter the admin center.
          </p>
        </div>
        <form action={publishAdminLoginAction}>
          <button className="button-muted" type="submit">
            Publish Current Draft
          </button>
        </form>
      </div>

      <form action={action} className="stack">
        <MediaField
          label="Admin login page photo"
          inputName="backgroundImageUrl"
          fileName="backgroundImageFile"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          value={settings.backgroundImageUrl}
          library={mediaLibrary}
          helper="This image is used on the isolated full-page admin login screen."
        />
        <MediaField
          label="Admin login logo"
          inputName="logoImageUrl"
          fileName="logoImageFile"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          value={settings.logoImageUrl}
          library={mediaLibrary}
          helper="Upload or select the logo used on the admin login panel."
        />
        <div className="admin-form-actions">
          <button className="button-muted" type="submit" name="intent" value="draft" disabled={pending}>
            {pending ? "Saving..." : "Save Admin Login Draft"}
          </button>
          <button className="button-primary" type="submit" name="intent" value="publish" disabled={pending}>
            {pending ? "Publishing..." : "Publish Admin Login"}
          </button>
        </div>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

function ToggleField({
  name,
  label,
  defaultChecked
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="checkbox-field">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      <span>{label}</span>
    </label>
  );
}

function slugify(value: string, fallback: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || fallback;
}

function blankService(index: number): HomepageServiceItem {
  return {
    title: "",
    description: "",
    icon: "briefcase-business",
    imageUrl: "",
    imageAlt: "",
    displayOrder: index + 1,
    enabled: true
  };
}

function blankAboutStat(): AboutStatCard {
  return { value: "", label: "", enabled: true };
}

function blankAboutBento(index: number): AboutBentoCard {
  return { icon: "sparkles", title: "", description: "", displayOrder: index + 1, enabled: true };
}

function blankAboutMarket(index: number): AboutMarketCard {
  return { icon: "map-pin", region: "", description: "", displayOrder: index + 1, enabled: true };
}

function blankAboutWhy(index: number): AboutWhyPoint {
  return { icon: "check", title: "", description: "", displayOrder: index + 1, enabled: true };
}

function blankAboutLogo(index: number): AboutLogoItem {
  return { name: "", imageUrl: "", href: "", enabled: true, displayOrder: index + 1 };
}

function blankGuide(index: number): HomepageGuideItem {
  return {
    slug: `guide-${index + 1}`,
    category: "",
    title: "",
    featuredImageAlt: "",
    summary: "",
    description: "",
    imageUrl: "",
    mainContent: "",
    tips: [],
    sections: [],
    faq: [],
    seoTitle: "",
    seoDescription: "",
    relatedSlugs: [],
    published: true,
    lastUpdated: new Date().toISOString().slice(0, 10)
  };
}

function FooterBadgeFields({
  prefix,
  label,
  items,
  mediaLibrary
}: {
  prefix: "membership" | "award";
  label: string;
  items: FooterBadge[];
  mediaLibrary: MediaLibraryItem[];
}) {
  return (
    <div className="stack">
      <div>
        <p className="eyebrow">{label}</p>
        <h3 className="settings-subtitle">Manage lightweight brand badges and partner proof.</h3>
      </div>
      {items.map((item, index) => (
        <div className="panel panel-soft" key={`${prefix}-${index}`}>
          <div className="form-grid">
            <label className="field">
              Name
              <input name={`${prefix}_${index}_name`} defaultValue={item.name} />
            </label>
            <label className="field">
              Optional Link
              <input name={`${prefix}_${index}_href`} defaultValue={item.href} />
            </label>
          </div>
          <MediaField
            label={`${label} image`}
            inputName={`${prefix}_${index}_imageUrl`}
            fileName={`${prefix}_${index}_imageFile`}
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            value={item.imageUrl}
            library={mediaLibrary}
          />
          <ToggleField
            name={`${prefix}_${index}_enabled`}
            label="Show this badge"
            defaultChecked={item.enabled}
          />
        </div>
      ))}
    </div>
  );
}

function FooterGroupFields({ groups }: { groups: FooterLinkGroup[] }) {
  return (
    <div className="stack">
      {groups.map((group, groupIndex) => (
        <div className="panel panel-soft" key={`group-${groupIndex}`}>
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Footer Group {groupIndex + 1}</p>
              <h3 className="settings-subtitle">Edit the title and links for this footer column.</h3>
            </div>
            <ToggleField
              name={`group_${groupIndex}_enabled`}
              label="Show group"
              defaultChecked={group.enabled}
            />
          </div>
          <div className="form-grid">
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              Group Title
              <input name={`group_${groupIndex}_title`} defaultValue={group.title} />
            </label>
            {group.items.map((item, itemIndex) => (
              <div className="panel panel-nested" key={`group-${groupIndex}-item-${itemIndex}`}>
                <p className="eyebrow">Item {itemIndex + 1}</p>
                <div className="form-grid">
                  <label className="field">
                    Label
                    <input
                      name={`group_${groupIndex}_item_${itemIndex}_label`}
                      defaultValue={item.label}
                    />
                  </label>
                  <label className="field">
                    Link
                    <input
                      name={`group_${groupIndex}_item_${itemIndex}_href`}
                      defaultValue={item.href}
                    />
                  </label>
                </div>
                <div className="toggle-row">
                  <ToggleField
                    name={`group_${groupIndex}_item_${itemIndex}_enabled`}
                    label="Show item"
                    defaultChecked={item.enabled}
                  />
                  <ToggleField
                    name={`group_${groupIndex}_item_${itemIndex}_external`}
                    label="External link"
                    defaultChecked={item.external}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function HeroSettingsForm({
  hero,
  mediaLibrary
}: {
  hero: HomepageHeroContent;
  mediaLibrary: MediaLibraryItem[];
}) {
  const [state, action, pending] = useActionState(saveHeroDraftAction, undefined);

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Homepage Hero</p>
          <h2>Control the premium first impression.</h2>
        </div>
        <form action={publishHeroAction}>
          <button className="button-muted" type="submit">
            Publish Hero
          </button>
        </form>
      </div>
      <form action={action} className="stack">
        <div className="form-grid">
          <input type="hidden" name="eyebrow" value={hero.eyebrow} />
          <input type="hidden" name="primaryCtaLabel" value="" />
          <input type="hidden" name="primaryCtaHref" value="" />
          <label className="field">
            Hero Media Type
            <select name="mediaType" defaultValue={hero.mediaType}>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            Hero Title
            <textarea name="title" defaultValue={hero.title} />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            Hero Description
            <textarea name="description" defaultValue={hero.description} />
          </label>
        </div>
        <MediaField
          label="Hero image or video"
          inputName="mediaUrl"
          fileName="heroMediaFile"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,video/mp4,video/webm,video/quicktime"
          value={hero.mediaUrl}
          library={mediaLibrary}
          helper="Upload or reuse a hero image/video from the media library. Video files are detected automatically."
        />
        <input type="hidden" name="mediaPosterUrl" value={hero.mediaPosterUrl} />
        <div className="stack">
          <div>
            <p className="eyebrow">Hero Floating Resort Logos</p>
            <h3 className="settings-subtitle">Upload up to five white resort logos for the bottom of the hero banner.</h3>
          </div>
          {Array.from({ length: 5 }, (_, index) => {
            const item = hero.featuredResortLogos?.[index] ?? {
              name: `Resort ${index + 1}`,
              imageUrl: "",
              href: "",
              enabled: true
            };
            return (
              <div className="panel panel-soft" key={`hero-logo-${index}`}>
                <div className="form-grid">
                  <label className="field">
                    Logo Label
                    <input name={`heroLogo_${index}_name`} defaultValue={item.name} />
                  </label>
                </div>
                <MediaField
                  label={`Hero resort logo ${index + 1}`}
                  inputName={`heroLogo_${index}_imageUrl`}
                  fileName={`heroLogo_${index}_imageFile`}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  value={item.imageUrl}
                  library={mediaLibrary}
                />
                <ToggleField
                  name={`heroLogo_${index}_enabled`}
                  label="Show this logo on homepage hero"
                  defaultChecked={item.enabled}
                />
              </div>
            );
          })}
        </div>
        <div className="admin-form-actions">
          <button className="button-muted" type="submit" name="intent" value="draft" disabled={pending}>
            {pending ? "Saving..." : "Save Hero Draft"}
          </button>
          <button className="button" type="submit" name="intent" value="publish" disabled={pending}>
            {pending ? "Publishing..." : "Save & Publish Hero"}
          </button>
        </div>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

export function FeaturesSettingsForm({
  features,
  mediaLibrary
}: {
  features: HomepageFeatureCard[];
  mediaLibrary: MediaLibraryItem[];
}) {
  const [state, action, pending] = useActionState(saveFeaturesDraftAction, undefined);

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Featured Retreats</p>
          <h2>Edit the homepage Featured Retreats section heading.</h2>
        </div>
        <form action={publishFeaturesAction}>
          <button className="button-muted" type="submit">
            Publish Featured Retreats Heading
          </button>
        </form>
      </div>
      <form action={action} className="stack">
        <div className="stack">
          {features.slice(0, 1).map((feature, index) => (
            <div className="panel panel-soft" key={`${feature.title}-${index}`}>
              <p className="eyebrow">Section heading</p>
              <div className="form-grid">
                <label className="field" style={index === 0 ? { display: "none" } : undefined}>
                  Eyebrow
                  <input name={`feature_${index}_eyebrow`} defaultValue={feature.eyebrow} />
                </label>
                <label className="field">
                  {index === 0 ? "Featured Retreats Title" : "Title"}
                  <input name={`feature_${index}_title`} defaultValue={feature.title} />
                </label>
                <label className="field" style={{ gridColumn: "1 / -1" }}>
                  {index === 0 ? "Featured Retreats Subtitle" : "Description"}
                  <textarea
                    name={`feature_${index}_description`}
                    defaultValue={feature.description}
                  />
                </label>
              </div>
              {index === 0 ? (
                <input type="hidden" name={`feature_${index}_imageUrl`} value={feature.imageUrl} />
              ) : (
                <MediaField
                  label={`Reserved image ${index + 1}`}
                  inputName={`feature_${index}_imageUrl`}
                  fileName={`feature_${index}_imageFile`}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  value={feature.imageUrl}
                  library={mediaLibrary}
                />
              )}
            </div>
          ))}
          {features.slice(1, 3).map((feature, offset) => {
            const index = offset + 1;
            return (
              <div key={`hidden-feature-${index}`} hidden>
                <input name={`feature_${index}_eyebrow`} value={feature.eyebrow} readOnly />
                <input name={`feature_${index}_title`} value={feature.title} readOnly />
                <input name={`feature_${index}_description`} value={feature.description} readOnly />
                <input name={`feature_${index}_imageUrl`} value={feature.imageUrl} readOnly />
              </div>
            );
          })}
        </div>
        <div className="admin-form-actions">
          <button className="button-muted" type="submit" name="intent" value="draft" disabled={pending}>
            {pending ? "Saving..." : "Save Heading Draft"}
          </button>
          <button className="button" type="submit" name="intent" value="publish" disabled={pending}>
            {pending ? "Publishing..." : "Save & Publish Heading"}
          </button>
        </div>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

export function NavbarSettingsForm({
  navbar,
  mediaLibrary
}: {
  navbar: NavbarContent;
  mediaLibrary: MediaLibraryItem[];
}) {
  const [state, action, pending] = useActionState(saveNavbarDraftAction, undefined);
  const [publishState, publishAction, publishPending] = useActionState(publishNavbarAction, undefined);

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Navbar & Logos</p>
          <h2>Publish the global navigation and brand treatment from admin.</h2>
        </div>
        <form action={publishAction}>
          <button className="button-muted" type="submit" disabled={publishPending}>
            {publishPending ? "Publishing..." : "Publish Navbar"}
          </button>
        </form>
      </div>
      <form action={action} className="stack">
        <div className="form-grid">
          <label className="field">
            Brand Kicker
            <input name="brandKicker" defaultValue={navbar.brandKicker} />
          </label>
          <label className="field">
            Brand Label
            <input name="brandLabel" defaultValue={navbar.brandLabel} />
          </label>
          <label className="field">
            Partner Login URL
            <input name="partnerLoginHref" defaultValue={navbar.partnerLoginHref || navbar.ctaHref} />
          </label>
          <label className="field">
            CTA Label
            <input name="ctaLabel" defaultValue={navbar.ctaLabel} />
          </label>
          <label className="field">
            CTA Link
            <input name="ctaHref" defaultValue={navbar.ctaHref} />
          </label>
        </div>
        <MediaField
          label="Primary logo"
          inputName="primaryLogoUrl"
          fileName="primaryLogoFile"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          value={navbar.primaryLogoUrl}
          library={mediaLibrary}
        />
        <MediaField
          label="White logo"
          inputName="whiteLogoUrl"
          fileName="whiteLogoFile"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          value={navbar.whiteLogoUrl}
          library={mediaLibrary}
        />
        <MediaField
          label="Black logo"
          inputName="blackLogoUrl"
          fileName="blackLogoFile"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          value={navbar.blackLogoUrl}
          library={mediaLibrary}
        />
        <ToggleField name="ctaEnabled" label="Show navbar CTA button" defaultChecked={navbar.ctaEnabled} />
        <div className="stack">
          {navbar.navItems.map((item, index) => (
            <div className="panel panel-soft" key={`${item.label}-${index}`}>
              <p className="eyebrow">Nav Item {index + 1}</p>
              <div className="form-grid">
                <label className="field">
                  Label
                  <input name={`nav_${index}_label`} defaultValue={item.label} />
                </label>
                <label className="field">
                  Link
                  <input name={`nav_${index}_href`} defaultValue={item.href} />
                </label>
              </div>
              <div className="toggle-row">
                <ToggleField
                  name={`nav_${index}_enabled`}
                  label="Show item"
                  defaultChecked={item.enabled}
                />
                <ToggleField
                  name={`nav_${index}_external`}
                  label="External link"
                  defaultChecked={item.external}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="admin-form-actions">
          <button className="button-muted" type="submit" name="intent" value="draft" disabled={pending}>
            {pending ? "Saving..." : "Save Navbar Draft"}
          </button>
          <button className="button" type="submit" name="intent" value="publish" disabled={pending}>
            {pending ? "Publishing..." : "Save & Publish Navbar"}
          </button>
        </div>
        <StatusMessage message={state?.message || publishState?.message} error={state?.error || publishState?.error} />
      </form>
    </div>
  );
}

export function FooterSettingsForm({
  footer,
  mediaLibrary
}: {
  footer: FooterContent;
  mediaLibrary: MediaLibraryItem[];
}) {
  const [state, action, pending] = useActionState(saveFooterDraftAction, undefined);

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Footer & Contact</p>
          <h2>Publish brand copy, footer links, and trust signals to the front end.</h2>
        </div>
        <form action={publishFooterAction}>
          <button className="button-muted" type="submit">
            Publish Footer
          </button>
        </form>
      </div>
      <form action={action} className="stack">
        <div className="form-grid">
          <label className="field">
            Company Label
            <input name="companyLabel" defaultValue={footer.companyLabel} />
          </label>
          <label className="field">
            Contact Email
            <input name="contactEmail" defaultValue={footer.contactEmail} />
          </label>
          <label className="field">
            Contact Phone
            <input name="contactPhone" defaultValue={footer.contactPhone} />
          </label>
          <label className="field">
            Address
            <input name="address" defaultValue={footer.address} />
          </label>
          <label className="field">
            Samoa URL
            <input name="samoaUrl" defaultValue={footer.samoaUrl} />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            Footer Description
            <textarea name="description" defaultValue={footer.description} />
          </label>
        </div>
        <MediaField
          label="Footer company logo"
          inputName="companyLogoUrl"
          fileName="companyLogoFile"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          value={footer.companyLogoUrl}
          library={mediaLibrary}
        />
        <FooterGroupFields groups={footer.linkGroups} />
        <FooterBadgeFields
          prefix="membership"
          label="Memberships"
          items={footer.memberships}
          mediaLibrary={mediaLibrary}
        />
        <FooterBadgeFields
          prefix="award"
          label="Awards"
          items={footer.awards}
          mediaLibrary={mediaLibrary}
        />
        <div className="admin-form-actions">
          <button className="button-muted" type="submit" name="intent" value="draft" disabled={pending}>
            {pending ? "Saving..." : "Save Footer Draft"}
          </button>
          <button className="button" type="submit" name="intent" value="publish" disabled={pending}>
            {pending ? "Publishing..." : "Save & Publish Footer"}
          </button>
        </div>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

export function WhatsAppSettingsForm({ whatsApp }: { whatsApp: WhatsAppSettings }) {
  const [state, action, pending] = useActionState(saveWhatsAppDraftAction, undefined);

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">WhatsApp Touchpoint</p>
          <h2>Control the floating business contact CTA without touching code.</h2>
        </div>
        <form action={publishWhatsAppAction}>
          <button className="button-muted" type="submit">
            Publish WhatsApp
          </button>
        </form>
      </div>
      <form action={action} className="stack">
        <ToggleField name="enabled" label="Enable WhatsApp on the frontend" defaultChecked={whatsApp.enabled} />
        <div className="form-grid">
          <label className="field">
            Display Label
            <input name="label" defaultValue={whatsApp.label} />
          </label>
          <label className="field">
            Number
            <input name="number" defaultValue={whatsApp.number} />
          </label>
          <label className="field">
            Click Link
            <input name="link" defaultValue={whatsApp.link} />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            Prefilled Message
            <textarea name="presetMessage" defaultValue={whatsApp.presetMessage} />
          </label>
        </div>
        <div className="admin-form-actions">
          <button className="button-muted" type="submit" name="intent" value="draft" disabled={pending}>
            {pending ? "Saving..." : "Save WhatsApp Draft"}
          </button>
          <button className="button" type="submit" name="intent" value="publish" disabled={pending}>
            {pending ? "Publishing..." : "Save & Publish WhatsApp"}
          </button>
        </div>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

export function NotificationSettingsForm({
  notifications
}: {
  notifications: NotificationSettings;
}) {
  const [state, action, pending] = useActionState(saveNotificationDraftAction, undefined);
  const [testState, setTestState] = useState<{ pending: boolean; message?: string; error?: string }>({
    pending: false
  });

  async function sendTestEmail() {
    setTestState({ pending: true });

    try {
      const response = await fetch("/api/admin/email-test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to: notifications.businessContactEmail || notifications.partnerRequestEmail })
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; message?: string; error?: string } | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Could not send the test email.");
      }

      setTestState({ pending: false, message: payload.message || "Test email queued." });
    } catch (error) {
      setTestState({
        pending: false,
        error: error instanceof Error ? error.message : "Could not send the test email."
      });
    }
  }

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Notification Routing</p>
          <h2>Control partner request and newsletter recipients from the admin portal.</h2>
        </div>
        <form action={publishNotificationAction}>
          <button className="button-muted" type="submit">
            Publish Notifications
          </button>
        </form>
      </div>
      <form action={action} className="stack">
        <div className="form-grid">
          <label className="field">
            Partner Request Email
            <input name="partnerRequestEmail" defaultValue={notifications.partnerRequestEmail} />
          </label>
          <label className="field">
            Newsletter Email
            <input name="newsletterEmail" defaultValue={notifications.newsletterEmail} />
          </label>
          <label className="field">
            Business Contact Email
            <input name="businessContactEmail" defaultValue={notifications.businessContactEmail} />
          </label>
        </div>
        <div className="admin-form-actions">
          <button className="button-muted" type="submit" name="intent" value="draft" disabled={pending}>
            {pending ? "Saving..." : "Save Notification Draft"}
          </button>
          <button className="button" type="submit" name="intent" value="publish" disabled={pending}>
            {pending ? "Publishing..." : "Save & Publish Notifications"}
          </button>
          <button className="button-muted" type="button" onClick={sendTestEmail} disabled={testState.pending}>
            {testState.pending ? "Sending..." : "Send Test Email"}
          </button>
        </div>
        <StatusMessage message={state?.message} error={state?.error} />
        <StatusMessage message={testState.message} error={testState.error} />
      </form>
    </div>
  );
}

export function MarketSettingsForm({ markets }: { markets: MarketSettings }) {
  const [state, action, pending] = useActionState(saveMarketDraftAction, undefined);
  const [marketRows, setMarketRows] = useState(markets.options.length ? markets.options : []);

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Primary Markets</p>
          <h2>Manage the markets shown on the homepage map section and lead forms.</h2>
        </div>
        <form action={publishMarketAction}>
          <button className="button-muted" type="submit">
            Publish Markets
          </button>
        </form>
      </div>
      <form action={action} className="stack">
        <div className="form-grid">
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            Section Title
            <input name="sectionTitle" defaultValue={markets.sectionTitle} />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            Homepage Heading
            <input name="heading" defaultValue={markets.heading} />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            Homepage Subtitle
            <textarea name="description" defaultValue={markets.description} />
          </label>
        </div>
        <input type="hidden" name="market_count" value={marketRows.length} />
        <div className="stack">
          {marketRows.map((market, index) => (
            <details className="panel panel-soft admin-collapsible" key={`${market.id}-${index}`}>
              <summary>
                <span>{market.label || `Market ${index + 1}`}</span>
                <button
                  type="button"
                  className="button-muted"
                  onClick={(event) => {
                    event.preventDefault();
                    setMarketRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
                  }}
                >
                  Delete
                </button>
              </summary>
              <div className="form-grid">
                <input type="hidden" name={`market_${index}_id`} defaultValue={market.id} />
                <label className="field">
                  Market Label
                  <input name={`market_${index}_label`} defaultValue={market.label} />
                </label>
                <label className="field">
                  Region / Category
                  <input name={`market_${index}_region`} defaultValue={market.region} />
                </label>
                <label className="field">
                  Latitude
                  <input name={`market_${index}_latitude`} defaultValue={market.latitude} inputMode="decimal" />
                </label>
                <label className="field">
                  Longitude
                  <input name={`market_${index}_longitude`} defaultValue={market.longitude} inputMode="decimal" />
                </label>
                <label className="field">
                  Display Order
                  <input name={`market_${index}_displayOrder`} defaultValue={market.displayOrder} inputMode="numeric" />
                </label>
              </div>
              <ToggleField
                name={`market_${index}_enabled`}
                label="Show market on homepage map"
                defaultChecked={market.enabled}
              />
            </details>
          ))}
        </div>
        <button
          className="button-muted"
          type="button"
          onClick={() =>
            setMarketRows((rows) => [
              ...rows,
              {
                id: `market-${Date.now()}`,
                label: "",
                latitude: 0,
                longitude: 0,
                region: "",
                displayOrder: rows.length + 1,
                enabled: true
              }
            ])
          }
        >
          Add Market
        </button>
        <div className="admin-form-actions">
          <button className="button-muted" type="submit" name="intent" value="draft" disabled={pending}>
            {pending ? "Saving..." : "Save Market Draft"}
          </button>
          <button className="button" type="submit" name="intent" value="publish" disabled={pending}>
            {pending ? "Publishing..." : "Save & Publish Markets"}
          </button>
        </div>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

export function HomepageStatsForm({ stats }: { stats: HomepageStat[] }) {
  const [state, action, pending] = useActionState(saveStatsDraftAction, undefined);

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Homepage Stats</p>
          <h2>Control the expertise counters shown on the homepage.</h2>
        </div>
        <form action={publishStatsAction}>
          <button className="button-muted" type="submit">
            Publish Stats
          </button>
        </form>
      </div>
      <form action={action} className="stack">
        {stats.map((item, index) => (
          <div className="panel panel-soft" key={`${item.label}-${index}`}>
            <div className="form-grid">
              <label className="field">
                Value
                <input name={`stat_${index}_value`} defaultValue={item.value} />
              </label>
              <label className="field">
                Label
                <input name={`stat_${index}_label`} defaultValue={item.label} />
              </label>
            </div>
          </div>
        ))}
        <div className="admin-form-actions">
          <button className="button-muted" type="submit" name="intent" value="draft" disabled={pending}>
            {pending ? "Saving..." : "Save Stats Draft"}
          </button>
          <button className="button" type="submit" name="intent" value="publish" disabled={pending}>
            {pending ? "Publishing..." : "Save & Publish Stats"}
          </button>
        </div>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

export function HomepageCeoForm({
  ceo,
  mediaLibrary
}: {
  ceo: HomepageCeoContent;
  mediaLibrary: MediaLibraryItem[];
}) {
  const [state, action, pending] = useActionState(saveCeoDraftAction, undefined);

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">CEO Message</p>
          <h2>Manage the CEO section content and image from admin.</h2>
        </div>
        <form action={publishCeoAction}>
          <button className="button-muted" type="submit">
            Publish CEO Section
          </button>
        </form>
      </div>
      <form action={action} className="stack">
        <div className="form-grid">
          <label className="field">
            Section Label
            <input name="sectionLabel" defaultValue={ceo.sectionLabel} />
          </label>
          <label className="field">
            CEO Name
            <input name="name" defaultValue={ceo.name} />
          </label>
          <label className="field">
            CEO Title
            <input name="title" defaultValue={ceo.title} />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            Quote
            <textarea name="quote" defaultValue={ceo.quote} />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            Message
            <textarea name="message" defaultValue={ceo.message} />
          </label>
        </div>
        <MediaField
          label="CEO photo"
          inputName="photoUrl"
          fileName="photoFile"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          value={ceo.photoUrl}
          library={mediaLibrary}
        />
        <div className="admin-form-actions">
          <button className="button-muted" type="submit" name="intent" value="draft" disabled={pending}>
            {pending ? "Saving..." : "Save CEO Draft"}
          </button>
          <button className="button" type="submit" name="intent" value="publish" disabled={pending}>
            {pending ? "Publishing..." : "Save & Publish CEO Section"}
          </button>
        </div>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

export function HomepageStoryForm({
  story,
  mediaLibrary
}: {
  story: HomepageStoryContent;
  mediaLibrary: MediaLibraryItem[];
}) {
  const [state, action, pending] = useActionState(saveStoryDraftAction, undefined);

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Our Story</p>
          <h2>Manage the story title, description, and image.</h2>
        </div>
        <form action={publishStoryAction}>
          <button className="button-muted" type="submit">
            Publish Story
          </button>
        </form>
      </div>
      <form action={action} className="stack">
        <div className="form-grid">
          <label className="field">
            Section Label
            <input name="sectionLabel" defaultValue={story.sectionLabel} />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            Title
            <input name="title" defaultValue={story.title} />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            Description
            <textarea name="description" defaultValue={story.description} />
          </label>
        </div>
        <MediaField
          label="Story image"
          inputName="imageUrl"
          fileName="storyImageFile"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          value={story.imageUrl}
          library={mediaLibrary}
        />
        <div className="admin-form-actions">
          <button className="button-muted" type="submit" name="intent" value="draft" disabled={pending}>
            {pending ? "Saving..." : "Save Story Draft"}
          </button>
          <button className="button" type="submit" name="intent" value="publish" disabled={pending}>
            {pending ? "Publishing..." : "Save & Publish Story"}
          </button>
        </div>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

export function HomepageServicesForm({
  services,
  mediaLibrary
}: {
  services: HomepageServiceItem[];
  mediaLibrary: MediaLibraryItem[];
}) {
  const [state, action, pending] = useActionState(saveServicesDraftAction, undefined);
  const [serviceRows, setServiceRows] = useState(services.length ? services : [blankService(0)]);

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Homepage Services</p>
          <h2>Manage the DMC services cards shown on the homepage.</h2>
        </div>
        <form action={publishServicesAction}>
          <button className="button-muted" type="submit">
            Publish Services
          </button>
        </form>
      </div>
      <form action={action} className="stack">
        <input type="hidden" name="service_count" value={serviceRows.length} />
        {serviceRows.map((item, index) => (
          <details className="panel panel-soft admin-collapsible" key={`${item.title}-${index}`} open={!item.title}>
            <summary>
              <span>{item.title || `Service ${index + 1}`}</span>
              <button
                type="button"
                className="button-muted"
                onClick={(event) => {
                  event.preventDefault();
                  setServiceRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
                }}
              >
                Delete
              </button>
            </summary>
            <div className="form-grid">
              <label className="field">
                Service Title
                <input name={`service_${index}_title`} defaultValue={item.title} />
              </label>
              <label className="field">
                Icon
                <select name={`service_${index}_icon`} defaultValue={item.icon}>
                  <option value="briefcase-business">Contracting</option>
                  <option value="route">Itinerary</option>
                  <option value="plane">Arrival</option>
                  <option value="headphones">Support</option>
                  <option value="users-round">Groups</option>
                  <option value="badge-percent">Offers</option>
                </select>
              </label>
              <label className="field">
                Display Order
                <input name={`service_${index}_displayOrder`} defaultValue={item.displayOrder} inputMode="numeric" />
              </label>
              <label className="field" style={{ gridColumn: "1 / -1" }}>
                Short Description
                <textarea name={`service_${index}_description`} defaultValue={item.description} />
              </label>
              <label className="field" style={{ gridColumn: "1 / -1" }}>
                Image Alt Text
                <input name={`service_${index}_imageAlt`} defaultValue={item.imageAlt} />
              </label>
            </div>
            <MediaField
              label="Service photo"
              inputName={`service_${index}_imageUrl`}
              fileName={`service_${index}_imageFile`}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              value={item.imageUrl}
              library={mediaLibrary}
            />
            <ToggleField
              name={`service_${index}_enabled`}
              label="Show service"
              defaultChecked={item.enabled}
            />
          </details>
        ))}
        <button
          className="button-muted"
          type="button"
          onClick={() => setServiceRows((rows) => [...rows, blankService(rows.length)])}
        >
          Add Service
        </button>
        <div className="admin-form-actions">
          <button className="button-muted" type="submit" name="intent" value="draft" disabled={pending}>
            {pending ? "Saving..." : "Save Services Draft"}
          </button>
          <button className="button" type="submit" name="intent" value="publish" disabled={pending}>
            {pending ? "Publishing..." : "Save & Publish Services"}
          </button>
        </div>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

export function HomepageWhyUsForm({ items }: { items: HomepageWhyUsItem[] }) {
  const [state, action, pending] = useActionState(saveWhyUsDraftAction, undefined);
  const [rows, setRows] = useState(items.length ? items : [{ title: "", description: "" }]);

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Why Us</p>
          <h2>Manage the homepage value proposition items.</h2>
        </div>
        <form action={publishWhyUsAction}>
          <button className="button-muted" type="submit">
            Publish Why Us
          </button>
        </form>
      </div>
      <form action={action} className="stack">
        <input type="hidden" name="why_count" value={rows.length} />
        {rows.map((item, index) => (
          <div className="panel panel-soft" key={`${item.title}-${index}`}>
            <div className="section-heading compact">
              <p className="eyebrow">Value Proposition {index + 1}</p>
              <button
                type="button"
                className="button-muted"
                onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}
              >
                Delete
              </button>
            </div>
            <div className="form-grid">
              <label className="field">
                Title
                <input name={`item_${index}_title`} defaultValue={item.title} />
              </label>
              <label className="field" style={{ gridColumn: "1 / -1" }}>
                Description
                <textarea name={`item_${index}_description`} defaultValue={item.description} />
              </label>
            </div>
          </div>
        ))}
        <button
          className="button-muted"
          type="button"
          onClick={() => setRows((current) => [...current, { title: "", description: "" }])}
        >
          Add Value Proposition
        </button>
        <div className="admin-form-actions">
          <button className="button-muted" type="submit" name="intent" value="draft" disabled={pending}>
            {pending ? "Saving..." : "Save Why Us Draft"}
          </button>
          <button className="button" type="submit" name="intent" value="publish" disabled={pending}>
            {pending ? "Publishing..." : "Save & Publish Why Us"}
          </button>
        </div>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

export function HomepageGuideForm({
  items,
  mediaLibrary
}: {
  items: HomepageGuideItem[];
  mediaLibrary: MediaLibraryItem[];
}) {
  const [state, action, pending] = useActionState(saveGuideDraftAction, undefined);
  const [guideRows, setGuideRows] = useState(items.length ? items : [blankGuide(0)]);

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Travel Guide</p>
          <h2>Manage tourist and partner guide articles.</h2>
        </div>
        <form action={publishGuideAction}>
          <button className="button-muted" type="submit">
            Publish Guide
          </button>
        </form>
      </div>
      <form action={action} className="stack">
        <input type="hidden" name="guide_count" value={guideRows.length} />
        {guideRows.map((item, index) => (
          <details className="panel panel-soft admin-collapsible" key={`${item.slug}-${index}`} open={!item.title}>
            <summary>
              <span>{item.title || `Travel Guide ${index + 1}`}</span>
              <button
                type="button"
                className="button-muted"
                onClick={(event) => {
                  event.preventDefault();
                  setGuideRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
                }}
              >
                Delete
              </button>
            </summary>
            <div className="form-grid">
              <label className="field">
                Category
                <input name={`guide_${index}_category`} defaultValue={item.category} />
              </label>
              <label className="field">
                Slug / URL
                <input
                  name={`guide_${index}_slug`}
                  defaultValue={item.slug || slugify(item.title, `guide-${index + 1}`)}
                />
              </label>
              <label className="field">
                Last Updated Date
                <input name={`guide_${index}_lastUpdated`} type="date" defaultValue={item.lastUpdated} />
              </label>
              <label className="field" style={{ gridColumn: "1 / -1" }}>
                Article Title
                <input name={`guide_${index}_title`} defaultValue={item.title} />
              </label>
              <label className="field" style={{ gridColumn: "1 / -1" }}>
                Summary
                <textarea name={`guide_${index}_summary`} defaultValue={item.summary || item.description} />
              </label>
              <label className="field" style={{ gridColumn: "1 / -1" }}>
                Main Blog Content
                <textarea name={`guide_${index}_mainContent`} defaultValue={item.mainContent} />
              </label>
              <label className="field" style={{ gridColumn: "1 / -1" }}>
                Tips / Highlight Blocks
                <textarea name={`guide_${index}_tips`} defaultValue={item.tips.join("\n")} />
              </label>
            </div>
            <MediaField
              label="Featured image"
              inputName={`guide_${index}_imageUrl`}
              fileName={`guide_${index}_imageFile`}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              value={item.imageUrl}
              library={mediaLibrary}
            />
            <label className="field">
              Featured Image Alt Text
              <input name={`guide_${index}_featuredImageAlt`} defaultValue={item.featuredImageAlt} />
            </label>
            <div className="stack">
              <p className="eyebrow">Additional Sections</p>
              {[0, 1, 2].map((sectionIndex) => {
                const section = item.sections[sectionIndex] ?? { heading: "", body: "" };
                return (
                  <div className="panel panel-nested" key={`section-${sectionIndex}`}>
                    <div className="form-grid">
                      <label className="field">
                        Heading
                        <input name={`guide_${index}_section_${sectionIndex}_heading`} defaultValue={section.heading} />
                      </label>
                      <label className="field" style={{ gridColumn: "1 / -1" }}>
                        Body
                        <textarea name={`guide_${index}_section_${sectionIndex}_body`} defaultValue={section.body} />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="stack">
              <p className="eyebrow">FAQ</p>
              {[0, 1, 2].map((faqIndex) => {
                const faq = item.faq[faqIndex] ?? { question: "", answer: "" };
                return (
                  <div className="panel panel-nested" key={`faq-${faqIndex}`}>
                    <div className="form-grid">
                      <label className="field">
                        Question
                        <input name={`guide_${index}_faq_${faqIndex}_question`} defaultValue={faq.question} />
                      </label>
                      <label className="field" style={{ gridColumn: "1 / -1" }}>
                        Answer
                        <textarea name={`guide_${index}_faq_${faqIndex}_answer`} defaultValue={faq.answer} />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="form-grid">
              <label className="field">
                SEO Title
                <input name={`guide_${index}_seoTitle`} defaultValue={item.seoTitle} />
              </label>
              <label className="field" style={{ gridColumn: "1 / -1" }}>
                SEO Description
                <textarea name={`guide_${index}_seoDescription`} defaultValue={item.seoDescription} />
              </label>
              <label className="field" style={{ gridColumn: "1 / -1" }}>
                Related Travel Guides
                <textarea name={`guide_${index}_relatedSlugs`} defaultValue={item.relatedSlugs.join("\n")} />
              </label>
            </div>
            <ToggleField name={`guide_${index}_published`} label="Published" defaultChecked={item.published} />
          </details>
        ))}
        <button
          className="button-muted"
          type="button"
          onClick={() => setGuideRows((rows) => [...rows, blankGuide(rows.length)])}
        >
          Add Travel Guide
        </button>
        <div className="admin-form-actions">
          <button className="button-muted" type="submit" name="intent" value="draft" disabled={pending}>
            {pending ? "Saving..." : "Save Guide Draft"}
          </button>
          <button className="button" type="submit" name="intent" value="publish" disabled={pending}>
            {pending ? "Publishing..." : "Save & Publish Guide"}
          </button>
        </div>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

export function HomepageNewsletterContentForm({
  newsletter,
  mediaLibrary
}: {
  newsletter: HomepageNewsletterContent;
  mediaLibrary: MediaLibraryItem[];
}) {
  const [state, action, pending] = useActionState(saveNewsletterContentDraftAction, undefined);

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Homepage Newsletter</p>
        </div>
        <form action={publishNewsletterContentAction}>
          <button className="button-muted" type="submit">
            Publish Newsletter Section
          </button>
        </form>
      </div>
      <form action={action} className="stack">
        <div className="form-grid">
          <label className="field">
            Section Label
            <input name="sectionLabel" defaultValue={newsletter.sectionLabel} />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            Title
            <input name="title" defaultValue={newsletter.title} />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            Description
            <textarea name="description" defaultValue={newsletter.description} />
          </label>
        </div>
        <MediaField
          label="Newsletter image"
          inputName="imageUrl"
          fileName="newsletterImageFile"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          value={newsletter.imageUrl}
          library={mediaLibrary}
        />
        <div className="admin-form-actions">
          <button className="button-muted" type="submit" name="intent" value="draft" disabled={pending}>
            {pending ? "Saving..." : "Save Newsletter Draft"}
          </button>
          <button className="button" type="submit" name="intent" value="publish" disabled={pending}>
            {pending ? "Publishing..." : "Save & Publish Newsletter"}
          </button>
        </div>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

export function HomepageAwardsForm({
  awards,
  mediaLibrary
}: {
  awards: HomepageAwardsContent;
  mediaLibrary: MediaLibraryItem[];
}) {
  const [state, action, pending] = useActionState(saveAwardsDraftAction, undefined);
  const [awardRows, setAwardRows] = useState(
    awards.items.length ? awards.items : [{ name: "", imageUrl: "", href: "", enabled: true }]
  );

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Homepage Awards</p>
          <h2>Manage the awards block shown on the homepage.</h2>
        </div>
        <form action={publishAwardsAction}>
          <button className="button-muted" type="submit">
            Publish Awards
          </button>
        </form>
      </div>
      <form action={action} className="stack">
        <div className="form-grid">
          <label className="field">
            Section Title
            <input name="title" defaultValue={awards.title} />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            Summary
            <textarea name="summary" defaultValue={awards.summary} />
          </label>
        </div>
        <input type="hidden" name="award_count" value={awardRows.length} />
        <div className="stack">
          {awardRows.map((award, index) => (
            <div className="panel panel-soft" key={`${award.name}-${index}`}>
              <div className="section-heading compact">
                <p className="eyebrow">Award {index + 1}</p>
                <button
                  type="button"
                  className="button-muted"
                  onClick={() => setAwardRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}
                >
                  Delete
                </button>
              </div>
              <div className="form-grid">
                <label className="field">
                  Name
                  <input name={`award_${index}_name`} defaultValue={award.name} />
                </label>
                <label className="field">
                  Optional Link
                  <input name={`award_${index}_href`} defaultValue={award.href} />
                </label>
              </div>
              <MediaField
                label="Award logo"
                inputName={`award_${index}_imageUrl`}
                fileName={`award_${index}_imageFile`}
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                value={award.imageUrl}
                library={mediaLibrary}
              />
              <ToggleField
                name={`award_${index}_enabled`}
                label="Show this award"
                defaultChecked={award.enabled}
              />
            </div>
          ))}
        </div>
        <button
          className="button-muted"
          type="button"
          onClick={() => setAwardRows((rows) => [...rows, { name: "", imageUrl: "", href: "", enabled: true }])}
        >
          Add Award
        </button>
        <div className="admin-form-actions">
          <button className="button-muted" type="submit" name="intent" value="draft" disabled={pending}>
            {pending ? "Saving..." : "Save Awards Draft"}
          </button>
          <button className="button" type="submit" name="intent" value="publish" disabled={pending}>
            {pending ? "Publishing..." : "Save & Publish Awards"}
          </button>
        </div>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}
