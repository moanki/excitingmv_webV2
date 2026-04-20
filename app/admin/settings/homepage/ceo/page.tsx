import { HomepageCeoForm } from "@/app/admin/settings/forms";
import { getHomepageCeoContent } from "@/lib/site-content";

export default async function AdminHomepageCeoPage() {
  const { content: ceo } = await getHomepageCeoContent("draft");
  return <HomepageCeoForm ceo={ceo} />;
}
