import { ContactSettingsForm } from "@/app/admin/settings/forms";
import { getContactPageContent } from "@/lib/site-content";

export default async function AdminContactSettingsPage() {
  const { content } = await getContactPageContent("draft");

  return <ContactSettingsForm contact={content} />;
}
