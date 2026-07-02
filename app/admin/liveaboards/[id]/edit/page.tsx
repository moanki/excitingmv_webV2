import { notFound } from "next/navigation";

import { ResortEditor } from "@/app/admin/resorts/forms";
import { getHomepageFeaturedResortsSetting } from "@/lib/site-content";
import { getAdminResortById } from "@/lib/services/resort-service";
import { listSiteAssets } from "@/lib/storage/site-assets";

const labels = {
  singular: "Liveaboard",
  plural: "Liveaboards",
  publicBasePath: "/liveaboards",
  adminBasePath: "/admin/liveaboards"
};

export default async function EditAdminLiveaboardPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [liveaboard, mediaLibrary, { content: featuredResorts }] = await Promise.all([
    getAdminResortById(id),
    listSiteAssets(),
    getHomepageFeaturedResortsSetting("draft")
  ]);

  if (!liveaboard || liveaboard.propertyType !== "liveaboards") {
    notFound();
  }

  const hasCuratedFeaturedList = featuredResorts.length > 0;
  const isHomepageFeatured = hasCuratedFeaturedList
    ? featuredResorts.some((item) => item.resortId === liveaboard.id)
    : Boolean(liveaboard.isFeaturedHomepage);

  return (
    <ResortEditor
      resort={liveaboard}
      title="Edit Liveaboard"
      description="Work on one selected liveaboard at a time with dedicated sections for content, rooms, media, and publishing."
      mediaLibrary={mediaLibrary}
      mode="edit"
      propertyType="liveaboards"
      labels={labels}
      isHomepageFeatured={isHomepageFeatured}
    />
  );
}
