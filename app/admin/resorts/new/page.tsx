import { ResortEditor } from "@/app/admin/resorts/forms";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function NewAdminResortPage() {
  const mediaLibrary = await listSiteAssets();

  return (
    <ResortEditor
      resort={{ status: "draft", isFeaturedHomepage: false, roomTypes: [] }}
      title="Add New Resort"
      description="Create a focused property workspace with resort basics, room types, media, and publishing controls."
      mediaLibrary={mediaLibrary}
      mode="create"
    />
  );
}
