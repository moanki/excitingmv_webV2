import { ResortEditor } from "@/app/admin/resorts/forms";
import { listCustomResortRatings } from "@/lib/services/resort-service";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function NewAdminResortPage() {
  const [mediaLibrary, customRatingOptions] = await Promise.all([listSiteAssets(), listCustomResortRatings()]);

  return (
    <ResortEditor
      resort={{ status: "draft", isFeaturedHomepage: false, roomTypes: [] }}
      title="Add New Resort"
      description="Create a focused property workspace with resort basics, room types, media, and publishing controls."
      mediaLibrary={mediaLibrary}
      customRatingOptions={customRatingOptions}
      mode="create"
    />
  );
}
