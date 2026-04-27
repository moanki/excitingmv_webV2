"use client";

import { useActionState } from "react";

import { MediaField, type MediaLibraryItem } from "@/components/media-field";
import {
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
          <label className="field">
            Eyebrow
            <input name="eyebrow" defaultValue={hero.eyebrow} />
          </label>
          <label className="field">
            Primary CTA Label
            <input name="primaryCtaLabel" defaultValue={hero.primaryCtaLabel} />
          </label>
          <label className="field">
            Primary CTA Link
            <input name="primaryCtaHref" defaultValue={hero.primaryCtaHref} />
          </label>
          <label className="field">
            Secondary CTA Label
            <input name="secondaryCtaLabel" defaultValue={hero.secondaryCtaLabel} />
          </label>
          <label className="field">
            Secondary CTA Link
            <input name="secondaryCtaHref" defaultValue={hero.secondaryCtaHref} />
          </label>
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
          helper="Upload, drag in, or reuse an asset from the media library."
        />
        <MediaField
          label="Video poster"
          inputName="mediaPosterUrl"
          fileName="heroPosterFile"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          value={hero.mediaPosterUrl}
          library={mediaLibrary}
          helper="Optional cover image used before the hero video plays."
        />
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
          <p className="eyebrow">Feature Cards</p>
          <h2>Edit the operational story on the homepage.</h2>
        </div>
        <form action={publishFeaturesAction}>
          <button className="button-muted" type="submit">
            Publish Features
          </button>
        </form>
      </div>
      <form action={action} className="stack">
        <div className="stack">
          {features.map((feature, index) => (
            <div className="panel panel-soft" key={`${feature.title}-${index}`}>
              <p className="eyebrow">Card {index + 1}</p>
              <div className="form-grid">
                <label className="field">
                  Eyebrow
                  <input name={`feature_${index}_eyebrow`} defaultValue={feature.eyebrow} />
                </label>
                <label className="field">
                  Title
                  <input name={`feature_${index}_title`} defaultValue={feature.title} />
                </label>
                <label className="field" style={{ gridColumn: "1 / -1" }}>
                  Description
                  <textarea
                    name={`feature_${index}_description`}
                    defaultValue={feature.description}
                  />
                </label>
              </div>
              <MediaField
                label={`Feature card ${index + 1} image`}
                inputName={`feature_${index}_imageUrl`}
                fileName={`feature_${index}_imageFile`}
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                value={feature.imageUrl}
                library={mediaLibrary}
              />
            </div>
          ))}
        </div>
        <div className="admin-form-actions">
          <button className="button-muted" type="submit" name="intent" value="draft" disabled={pending}>
            {pending ? "Saving..." : "Save Feature Draft"}
          </button>
          <button className="button" type="submit" name="intent" value="publish" disabled={pending}>
            {pending ? "Publishing..." : "Save & Publish Features"}
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

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Navbar & Logos</p>
          <h2>Publish the global navigation and brand treatment from admin.</h2>
        </div>
        <form action={publishNavbarAction}>
          <button className="button-muted" type="submit">
            Publish Navbar
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
        <StatusMessage message={state?.message} error={state?.error} />
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
        </div>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

export function MarketSettingsForm({ markets }: { markets: MarketSettings }) {
  const [state, action, pending] = useActionState(saveMarketDraftAction, undefined);
  const marketRows = Array.from({ length: 8 }, (_, index) => {
    const market = markets.options[index];
    return (
      market ?? {
        id: `market-${index + 1}`,
        label: "",
        latitude: 0,
        longitude: 0,
        region: "",
        displayOrder: index + 1,
        enabled: false
      }
    );
  });

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Primary Markets</p>
          <h2>Manage the markets shown on the homepage Mapbox section and lead forms.</h2>
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
        </div>
        <div className="stack">
          {marketRows.map((market, index) => (
            <div className="panel panel-soft" key={`${market.label}-${index}`}>
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
            </div>
          ))}
        </div>
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

export function HomepageServicesForm({ services }: { services: HomepageServiceItem[] }) {
  const [state, action, pending] = useActionState(saveServicesDraftAction, undefined);

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
        {services.map((item, index) => (
          <div className="panel panel-soft" key={`${item.title}-${index}`}>
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
            </div>
            <ToggleField
              name={`service_${index}_enabled`}
              label="Show service"
              defaultChecked={item.enabled}
            />
          </div>
        ))}
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
        {items.map((item, index) => (
          <div className="panel panel-soft" key={`${item.title}-${index}`}>
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

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Travel Guide</p>
          <h2>Manage the homepage travel guide cards.</h2>
        </div>
        <form action={publishGuideAction}>
          <button className="button-muted" type="submit">
            Publish Guide
          </button>
        </form>
      </div>
      <form action={action} className="stack">
        {items.map((item, index) => (
          <div className="panel panel-soft" key={`${item.title}-${index}`}>
            <div className="form-grid">
              <label className="field">
                Category
                <input name={`guide_${index}_category`} defaultValue={item.category} />
              </label>
              <label className="field" style={{ gridColumn: "1 / -1" }}>
                Title
                <input name={`guide_${index}_title`} defaultValue={item.title} />
              </label>
              <label className="field" style={{ gridColumn: "1 / -1" }}>
                Description
                <textarea name={`guide_${index}_description`} defaultValue={item.description} />
              </label>
            </div>
            <MediaField
              label={`Guide card ${index + 1} image`}
              inputName={`guide_${index}_imageUrl`}
              fileName={`guide_${index}_imageFile`}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              value={item.imageUrl}
              library={mediaLibrary}
            />
          </div>
        ))}
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
          <h2>Manage the newsletter heading, intro, and image.</h2>
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
        <FooterBadgeFields prefix="award" label="Award Logos" items={awards.items} mediaLibrary={mediaLibrary} />
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
