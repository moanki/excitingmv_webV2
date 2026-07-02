import { notFound } from "next/navigation";

import { ResortEditor } from "@/app/admin/resorts/forms";
import { getHomepageFeaturedResortsSetting } from "@/lib/site-content";
import { getAdminResortById } from "@/lib/services/resort-service";
import { listSiteAssets } from "@/lib/storage/site-assets";

const labels = {
  singular: "Hotel",
  plural: "Hotels",
  publicBasePath: "/hotels",
  adminBasePath: "/admin/hotels"
};

export default async function EditAdminHotelPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [hotel, mediaLibrary, { content: featuredResorts }] = await Promise.all([
    getAdminResortById(id),
    listSiteAssets(),
    getHomepageFeaturedResortsSetting("draft")
  ]);

  if (!hotel || hotel.propertyType !== "hotels") {
    notFound();
  }

  const hasCuratedFeaturedList = featuredResorts.length > 0;
  const isHomepageFeatured = hasCuratedFeaturedList
    ? featuredResorts.some((item) => item.resortId === hotel.id)
    : Boolean(hotel.isFeaturedHomepage);

  return (
    <ResortEditor
      resort={hotel}
      title="Edit Hotel"
      description="Work on one selected hotel at a time with dedicated sections for content, rooms, media, and publishing."
      mediaLibrary={mediaLibrary}
      mode="edit"
      propertyType="hotels"
      labels={labels}
      isHomepageFeatured={isHomepageFeatured}
    />
  );
}
