import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/auth/require-admin";
import { EmailConfigurationForm } from "@/app/admin/email-configuration/email-configuration-form";
import { getEmailConfiguration } from "@/lib/email/email-config";

export default async function AdminEmailConfigurationPage() {
  const admin=await getCurrentAdminUser();
  if(!admin?.roles.some(role=>role==="super_admin"||role==="admin")) redirect("/admin");
  const { encryptedPassword, passwordIv, passwordAuthTag, ...config } = await getEmailConfiguration();
  return <EmailConfigurationForm config={config} />;
}
