import { MarketSettingsForm } from "@/app/admin/settings/forms";
import { getMarketSettings } from "@/lib/site-content";

export default async function AdminMarketSettingsPage() {
  const { content: markets } = await getMarketSettings("draft");
  return <MarketSettingsForm markets={markets} />;
}
