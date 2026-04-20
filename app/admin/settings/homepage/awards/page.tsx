import { HomepageAwardsForm } from "@/app/admin/settings/forms";
import { getHomepageAwardsContent } from "@/lib/site-content";

export default async function AdminHomepageAwardsPage() {
  const { content: awards } = await getHomepageAwardsContent("draft");
  return <HomepageAwardsForm awards={awards} />;
}
