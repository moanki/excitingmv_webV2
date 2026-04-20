import { FeaturesSettingsForm } from "@/app/admin/settings/forms";
import { getHomepageFeatures } from "@/lib/site-content";

export default async function AdminHomepageFeaturesPage() {
  const { content: features } = await getHomepageFeatures("draft");
  return <FeaturesSettingsForm features={features} />;
}
