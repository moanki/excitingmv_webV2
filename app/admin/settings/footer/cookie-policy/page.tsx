import { getSitePolicy } from "@/lib/site-content";
import { PolicyForm } from "../policy-form";

export default async function CookiePolicySettingsPage() {
  const { content } = await getSitePolicy("cookies", "draft");
  return <PolicyForm id="cookies" policy={content} />;
}
