import { MediaManager } from "@/app/admin/media/media-manager";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function AdminMediaLibraryPage() {
  const items = await listSiteAssets();

  return <MediaManager items={items} />;
}
