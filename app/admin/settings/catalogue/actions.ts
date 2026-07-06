"use server";

import { revalidatePath } from "next/cache";

import {
  defaultCatalogueContent,
  publishSiteSetting,
  saveSiteSettingDraft,
  type CatalogueContent,
  type CatalogueKind
} from "@/lib/site-content";

type CatalogueActionState = { message?: string; error?: string } | undefined;

const catalogueKinds: CatalogueKind[] = ["resorts", "hotels", "liveaboards", "contact", "travel-guide"];

export async function saveCatalogueSettingsAction(
  _: CatalogueActionState,
  formData: FormData
): Promise<CatalogueActionState> {
  try {
    await Promise.all(catalogueKinds.map(async (kind) => {
      const fallback = defaultCatalogueContent[kind];
      const content: CatalogueContent = {
        heroImageUrl: String(formData.get(`${kind}HeroImageUrl`) ?? "").trim() || fallback.heroImageUrl,
        title: String(formData.get(`${kind}Title`) ?? "").trim() || fallback.title,
        body: String(formData.get(`${kind}Body`) ?? "").trim() || fallback.body,
        eyebrow: String(formData.get(`${kind}Eyebrow`) ?? "").trim() || fallback.eyebrow
      };

      await saveSiteSettingDraft(`catalogue.${kind}`, fallback, content);
      await publishSiteSetting(`catalogue.${kind}`, fallback);
    }));

    ["/resorts", "/hotels", "/liveaboards", "/contact", "/travel-guide", "/admin/settings/catalogue"].forEach((path) => revalidatePath(path));
    return { message: "Catalogue banners published successfully." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to publish catalogue banners." };
  }
}
