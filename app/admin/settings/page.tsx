import {
  FeaturesSettingsForm,
  FooterSettingsForm,
  HeroSettingsForm
} from "@/app/admin/settings/forms";
import {
  getFooterContent,
  getHomepageFeatures,
  getHomepageHeroContent
} from "@/lib/site-content";

export default async function AdminSettingsPage() {
  const [{ content: hero }, { content: features }, { content: footer }] = await Promise.all([
    getHomepageHeroContent("draft"),
    getHomepageFeatures("draft"),
    getFooterContent("draft")
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
      <FooterSettingsForm footer={footer} />
    </div>
  );
}
