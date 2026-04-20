import { HeroSettingsForm } from "@/app/admin/settings/forms";
import { getHomepageHeroContent } from "@/lib/site-content";

export default async function AdminHomepageHeroPage() {
  const { content: hero } = await getHomepageHeroContent("draft");
  return <HeroSettingsForm hero={hero} />;
}
