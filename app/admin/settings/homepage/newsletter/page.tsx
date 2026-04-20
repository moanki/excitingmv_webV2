import { HomepageNewsletterContentForm } from "@/app/admin/settings/forms";
import { getHomepageNewsletterContent } from "@/lib/site-content";

export default async function AdminHomepageNewsletterPage() {
  const { content: newsletter } = await getHomepageNewsletterContent("draft");
  return <HomepageNewsletterContentForm newsletter={newsletter} />;
}
