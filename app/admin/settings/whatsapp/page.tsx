import { WhatsAppSettingsForm } from "@/app/admin/settings/forms";
import { getWhatsAppSettings } from "@/lib/site-content";

export default async function AdminWhatsAppSettingsPage() {
  const { content: whatsApp } = await getWhatsAppSettings("draft");
  return <WhatsAppSettingsForm whatsApp={whatsApp} />;
}
