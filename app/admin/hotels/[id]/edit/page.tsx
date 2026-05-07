import { notFound } from "next/navigation";

import { ResortEditor } from "@/app/admin/resorts/forms";
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
  const [hotel, mediaLibrary] = await Promise.all([getAdminResortById(id), listSiteAssets()]);

  if (!hotel || hotel.propertyType !== "hotel") {
    notFound();
  }

  return (
    <ResortEditor
      resort={hotel}
      title="Edit Hotel"
      description="Work on one selected hotel with dedicated sections for content, rooms, media, and publishing."
      mediaLibrary={mediaLibrary}
      mode="edit"
      propertyType="hotel"
      labels={labels}
    />
  );
}
