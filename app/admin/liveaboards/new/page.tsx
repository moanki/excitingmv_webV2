import { ResortEditor } from "@/app/admin/resorts/forms";
import { listSiteAssets } from "@/lib/storage/site-assets";
import { listCustomResortRatings } from "@/lib/services/resort-service";

const labels = {
  singular: "Liveaboard",
  plural: "Liveaboards",
  publicBasePath: "/liveaboards",
  adminBasePath: "/admin/liveaboards"
};

export default async function NewAdminLiveaboardPage() {
  const [mediaLibrary, customRatingOptions] = await Promise.all([listSiteAssets(), listCustomResortRatings("liveaboards")]);

  return (
    <ResortEditor
      resort={{ status: "draft", isFeaturedHomepage: false, roomTypes: [] }}
      title="Add New Liveaboard"
      description="Create a focused property workspace with liveaboard basics, room types, media, and publishing controls."
      mediaLibrary={mediaLibrary}
      customRatingOptions={customRatingOptions}
      mode="create"
      propertyType="liveaboards"
      labels={labels}
    />
  );
}
