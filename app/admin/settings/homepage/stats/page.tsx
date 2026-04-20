import { HomepageStatsForm } from "@/app/admin/settings/forms";
import { getHomepageStats } from "@/lib/site-content";

export default async function AdminHomepageStatsPage() {
  const { content: stats } = await getHomepageStats("draft");
  return <HomepageStatsForm stats={stats} />;
}
