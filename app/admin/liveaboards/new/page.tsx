import { ResortEditor } from "@/app/admin/resorts/forms";
import { listSiteAssets } from "@/lib/storage/site-assets";

const labels = {
  singular: "Liveaboard",
  plural: "Liveaboards",
  publicBasePath: "/liveaboards",
  adminBasePath: "/admin/liveaboards"
};

export default async function NewAdminLiveaboardPage() {
  const mediaLibrary = await listSiteAssets();

  return (
    <ResortEditor
      resort={{ status: "draft", isFeaturedHomepage: false, roomTypes: [] }}
      title="Add New Liveaboard"
      description="Create a liveaboard workspace with content, media, cabins, SEO, and publishing controls."
      mediaLibrary={mediaLibrary}
      mode="create"
      propertyType="liveaboards"
      labels={labels}
    />
  );
}
