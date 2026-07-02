import { ResortEditor } from "@/app/admin/resorts/forms";
import { listSiteAssets } from "@/lib/storage/site-assets";

const labels = {
  singular: "Hotel",
  plural: "Hotels",
  publicBasePath: "/hotels",
  adminBasePath: "/admin/hotels"
};

export default async function NewAdminHotelPage() {
  const mediaLibrary = await listSiteAssets();

  return (
    <ResortEditor
      resort={{ status: "draft", isFeaturedHomepage: false, roomTypes: [] }}
      title="Add New Hotel"
      description="Create a focused property workspace with hotel basics, room types, media, and publishing controls."
      mediaLibrary={mediaLibrary}
      mode="create"
      propertyType="hotels"
      labels={labels}
    />
  );
}
