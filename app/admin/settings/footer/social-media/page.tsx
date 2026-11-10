import { getFooterSocialMedia } from "@/lib/site-content";
import { SocialMediaForm } from "./form";

export default async function SocialMediaSettingsPage() {
  const { content } = await getFooterSocialMedia("draft");
  return <SocialMediaForm links={content} />;
}
