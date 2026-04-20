import {
  FeaturesSettingsForm,
  FooterSettingsForm,
  HeroSettingsForm,
  MarketSettingsForm,
  NavbarSettingsForm,
  NotificationSettingsForm,
  WhatsAppSettingsForm
} from "@/app/admin/settings/forms";
import {
  getFooterContent,
  getHomepageFeatures,
  getHomepageHeroContent,
  getMarketSettings,
  getNavbarContent,
  getNotificationSettings,
  getWhatsAppSettings
} from "@/lib/site-content";

export default async function AdminSettingsPage() {
  const [
    { content: hero },
    { content: features },
    { content: navbar },
    { content: footer },
    { content: whatsApp },
    { content: notifications },
    { content: markets }
  ] = await Promise.all([
    getHomepageHeroContent("draft"),
    getHomepageFeatures("draft"),
    getNavbarContent("draft"),
    getFooterContent("draft"),
    getWhatsAppSettings("draft"),
    getNotificationSettings("draft"),
    getMarketSettings("draft")
  ]);

  return (
    <div className="stack">
      <section>
        <p className="eyebrow">Site Settings</p>
        <h1 className="section-title">Manage front-end content from the admin portal.</h1>
        <p className="muted">
          Edit draft content below, then publish each section when it is ready for the live site.
        </p>
      </section>
      <HeroSettingsForm hero={hero} />
      <FeaturesSettingsForm features={features} />
      <NavbarSettingsForm navbar={navbar} />
      <FooterSettingsForm footer={footer} />
      <WhatsAppSettingsForm whatsApp={whatsApp} />
      <NotificationSettingsForm notifications={notifications} />
      <MarketSettingsForm markets={markets} />
    </div>
  );
}
