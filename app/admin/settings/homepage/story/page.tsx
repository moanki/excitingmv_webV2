import { HomepageStoryForm } from "@/app/admin/settings/forms";
import { getHomepageStoryContent } from "@/lib/site-content";

export default async function AdminHomepageStoryPage() {
  const { content: story } = await getHomepageStoryContent("draft");
  return <HomepageStoryForm story={story} />;
}
