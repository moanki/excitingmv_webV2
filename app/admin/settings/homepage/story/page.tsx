import { HomepageStoryForm } from "@/app/admin/settings/forms";
import { getHomepageStoryContent } from "@/lib/site-content";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function AdminHomepageStoryPage() {
  const [{ content: story }, mediaLibrary] = await Promise.all([
    getHomepageStoryContent("draft"),
    listSiteAssets()
  ]);

  return <HomepageStoryForm story={story} mediaLibrary={mediaLibrary} />;
}
