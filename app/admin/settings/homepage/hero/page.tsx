import { HeroSettingsForm } from "@/app/admin/settings/forms";
import { getHomepageHeroContent } from "@/lib/site-content";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function AdminHomepageHeroPage() {
  const [{ content: hero }, mediaLibrary] = await Promise.all([
    getHomepageHeroContent("draft"),
    listSiteAssets()
  ]);

  return <HeroSettingsForm hero={hero} mediaLibrary={mediaLibrary} />;
}
