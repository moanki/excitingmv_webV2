import { FooterSettingsForm } from "@/app/admin/settings/forms";
import { getFooterContent } from "@/lib/site-content";

export default async function AdminFooterSettingsPage() {
  const { content: footer } = await getFooterContent("draft");
  return <FooterSettingsForm footer={footer} />;
}
