import { CatalogueSettingsForm } from "@/app/admin/settings/catalogue/catalogue-settings-form";
import { getCatalogueContent } from "@/lib/site-content";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function AdminCatalogueSettingsPage() {
  const [resorts, hotels, liveaboards, mediaLibrary] = await Promise.all([
    getCatalogueContent("resorts", "draft"),
    getCatalogueContent("hotels", "draft"),
    getCatalogueContent("liveaboards", "draft"),
    listSiteAssets()
  ]);

  return (
    <CatalogueSettingsForm
      catalogues={{ resorts: resorts.content, hotels: hotels.content, liveaboards: liveaboards.content }}
      mediaLibrary={mediaLibrary}
    />
  );
}
