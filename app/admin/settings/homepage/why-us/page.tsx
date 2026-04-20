import { HomepageWhyUsForm } from "@/app/admin/settings/forms";
import { getHomepageWhyUs } from "@/lib/site-content";

export default async function AdminHomepageWhyUsPage() {
  const { content: items } = await getHomepageWhyUs("draft");
  return <HomepageWhyUsForm items={items} />;
}
