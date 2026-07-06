import { CatalogueSettingsForm } from "@/app/admin/settings/catalogue/catalogue-settings-form";
import { getCatalogueContent } from "@/lib/site-content";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function AdminCatalogueSettingsPage() {
  const [resorts, hotels, liveaboards, contact, travelGuide, mediaLibrary] = await Promise.all([
    getCatalogueContent("resorts", "draft"),
    getCatalogueContent("hotels", "draft"),
    getCatalogueContent("liveaboards", "draft"),
    getCatalogueContent("contact", "draft"),
    getCatalogueContent("travel-guide", "draft"),
    listSiteAssets()
  ]);

  return (
    <CatalogueSettingsForm
      catalogues={{
        resorts: resorts.content,
        hotels: hotels.content,
        liveaboards: liveaboards.content,
        contact: contact.content,
        "travel-guide": travelGuide.content
      }}
      mediaLibrary={mediaLibrary}
    />
  );
}
