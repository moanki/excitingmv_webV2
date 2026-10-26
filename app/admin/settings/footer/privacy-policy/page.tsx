import { getSitePolicy } from "@/lib/site-content";
import { PolicyForm } from "../policy-form";

export default async function PrivacyPolicySettingsPage() {
  const { content } = await getSitePolicy("privacy", "draft");
  return <PolicyForm id="privacy" policy={content} />;
}
