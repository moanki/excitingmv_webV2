import { ResortEditor } from "@/app/admin/resorts/forms";
import { listSiteAssets } from "@/lib/storage/site-assets";
import { listCustomResortRatings } from "@/lib/services/resort-service";

const labels = {
  singular: "Hotel",
  plural: "Hotels",
  publicBasePath: "/hotels",
  adminBasePath: "/admin/hotels"
};

export default async function NewAdminHotelPage() {
  const [mediaLibrary, customRatingOptions] = await Promise.all([listSiteAssets(), listCustomResortRatings("hotels")]);

  return (
    <ResortEditor
      resort={{ status: "draft", isFeaturedHomepage: false, roomTypes: [] }}
      title="Add New Hotel"
      description="Create a focused property workspace with hotel basics, room types, media, and publishing controls."
      mediaLibrary={mediaLibrary}
      customRatingOptions={customRatingOptions}
      mode="create"
      propertyType="hotels"
      labels={labels}
    />
  );
}
