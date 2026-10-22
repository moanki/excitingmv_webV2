import { notFound } from "next/navigation";

import { ResortEditor } from "@/app/admin/resorts/forms";
import { getHomepageFeaturedResortsSetting } from "@/lib/site-content";
import { getAdminResortById, listCustomResortRatings } from "@/lib/services/resort-service";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function EditAdminResortPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [resort, mediaLibrary, { content: featuredResorts }, customRatingOptions] = await Promise.all([
    getAdminResortById(id),
    listSiteAssets(),
    getHomepageFeaturedResortsSetting("draft"),
    listCustomResortRatings()
  ]);

  if (!resort) {
    notFound();
  }

  const hasCuratedFeaturedList = featuredResorts.length > 0;
  const isHomepageFeatured = hasCuratedFeaturedList
    ? featuredResorts.some((item) => item.resortId === resort.id)
    : Boolean(resort.isFeaturedHomepage);

  return (
    <ResortEditor
      resort={resort}
      title="Edit Resort"
      description="Work on one selected resort at a time with dedicated sections for content, rooms, media, and publishing."
      mediaLibrary={mediaLibrary}
      customRatingOptions={customRatingOptions}
      mode="edit"
      isHomepageFeatured={isHomepageFeatured}
    />
  );
}
