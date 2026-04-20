"use client";

import { useActionState } from "react";

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
  saveWhatsAppDraftAction
  ,
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
  items
}: {
  prefix: "membership" | "award";
  label: string;
  items: FooterBadge[];
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
              Logo URL
              <input name={`${prefix}_${index}_imageUrl`} defaultValue={item.imageUrl} />
            </label>
            <label className="field">
              Optional Link
              <input name={`${prefix}_${index}_href`} defaultValue={item.href} />
            </label>
          </div>
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

export function HeroSettingsForm({ hero }: { hero: HomepageHeroContent }) {
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
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            Hero Title
            <textarea name="title" defaultValue={hero.title} />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            Hero Description
            <textarea name="description" defaultValue={hero.description} />
          </label>
        </div>
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save Hero Draft"}
        </button>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

export function FeaturesSettingsForm({ features }: { features: HomepageFeatureCard[] }) {
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
            </div>
          ))}
        </div>
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save Feature Draft"}
        </button>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

export function NavbarSettingsForm({ navbar }: { navbar: NavbarContent }) {
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
            Primary Logo URL
            <input name="primaryLogoUrl" defaultValue={navbar.primaryLogoUrl} />
          </label>
          <label className="field">
            White Logo URL
            <input name="whiteLogoUrl" defaultValue={navbar.whiteLogoUrl} />
          </label>
          <label className="field">
            Black Logo URL
            <input name="blackLogoUrl" defaultValue={navbar.blackLogoUrl} />
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
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save Navbar Draft"}
        </button>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

export function FooterSettingsForm({ footer }: { footer: FooterContent }) {
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
        <FooterGroupFields groups={footer.linkGroups} />
        <FooterBadgeFields prefix="membership" label="Memberships" items={footer.memberships} />
        <FooterBadgeFields prefix="award" label="Awards" items={footer.awards} />
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save Footer Draft"}
        </button>
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
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save WhatsApp Draft"}
        </button>
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
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save Notification Draft"}
        </button>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

export function MarketSettingsForm({ markets }: { markets: MarketSettings }) {
  const [state, action, pending] = useActionState(saveMarketDraftAction, undefined);

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Primary Markets</p>
          <h2>Manage the market dropdown values used across lead capture forms.</h2>
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
          {markets.options.map((market, index) => (
            <div className="panel panel-soft" key={`${market.label}-${index}`}>
              <div className="form-grid">
                <label className="field">
                  Market Label
                  <input name={`market_${index}_label`} defaultValue={market.label} />
                </label>
              </div>
              <ToggleField
                name={`market_${index}_enabled`}
                label="Show market option"
                defaultChecked={market.enabled}
              />
            </div>
          ))}
        </div>
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save Market Draft"}
        </button>
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
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save Stats Draft"}
        </button>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

export function HomepageCeoForm({ ceo }: { ceo: HomepageCeoContent }) {
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
          <label className="field">
            Photo URL
            <input name="photoUrl" defaultValue={ceo.photoUrl} />
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
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save CEO Draft"}
        </button>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

export function HomepageStoryForm({ story }: { story: HomepageStoryContent }) {
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
          <label className="field">
            Story Image URL
            <input name="imageUrl" defaultValue={story.imageUrl} />
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
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save Story Draft"}
        </button>
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
            </div>
            <ToggleField
              name={`service_${index}_enabled`}
              label="Show service"
              defaultChecked={item.enabled}
            />
          </div>
        ))}
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save Services Draft"}
        </button>
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
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save Why Us Draft"}
        </button>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

export function HomepageGuideForm({ items }: { items: HomepageGuideItem[] }) {
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
              <label className="field">
                Image URL
                <input name={`guide_${index}_imageUrl`} defaultValue={item.imageUrl} />
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
          </div>
        ))}
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save Guide Draft"}
        </button>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

export function HomepageNewsletterContentForm({
  newsletter
}: {
  newsletter: HomepageNewsletterContent;
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
          <label className="field">
            Image URL
            <input name="imageUrl" defaultValue={newsletter.imageUrl} />
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
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save Newsletter Draft"}
        </button>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}

export function HomepageAwardsForm({ awards }: { awards: HomepageAwardsContent }) {
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
        <FooterBadgeFields prefix="award" label="Award Logos" items={awards.items} />
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save Awards Draft"}
        </button>
        <StatusMessage message={state?.message} error={state?.error} />
      </form>
    </div>
  );
}
