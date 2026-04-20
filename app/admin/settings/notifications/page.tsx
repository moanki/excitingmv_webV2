import { NotificationSettingsForm } from "@/app/admin/settings/forms";
import { getNotificationSettings } from "@/lib/site-content";

export default async function AdminNotificationSettingsPage() {
  const { content: notifications } = await getNotificationSettings("draft");
  return <NotificationSettingsForm notifications={notifications} />;
}
