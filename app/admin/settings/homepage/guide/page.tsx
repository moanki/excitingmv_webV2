import { HomepageGuideForm } from "@/app/admin/settings/forms";
import { getHomepageGuide } from "@/lib/site-content";

export default async function AdminHomepageGuidePage() {
  const { content: items } = await getHomepageGuide("draft");
  return <HomepageGuideForm items={items} />;
}
