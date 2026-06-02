import { EmailConfigurationForm } from "@/app/admin/email-configuration/email-configuration-form";
import { getEmailConfiguration } from "@/lib/email/email-config";

export default async function AdminEmailConfigurationPage() {
  const config = await getEmailConfiguration();
  return <EmailConfigurationForm config={config} />;
}
