import { HomepageServicesForm } from "@/app/admin/settings/forms";
import { getHomepageServices } from "@/lib/site-content";

export default async function AdminHomepageServicesPage() {
  const { content: services } = await getHomepageServices("draft");
  return <HomepageServicesForm services={services} />;
}
