import { notFound } from "next/navigation";
import { getUpcomingResorts } from "@/lib/services/upcoming-resorts-service";
import { listSiteAssets } from "@/lib/storage/site-assets";
import { CalendarEditor } from "./calendar-editor";
import "./calendar-editor.css";

export default async function AdminUpcomingResortsPage() {
  const [page, library] = await Promise.all([getUpcomingResorts("draft"), listSiteAssets()]);
  if (!page) notFound();
  return <CalendarEditor initial={page.content} revision={page.revision} library={library} />;
}
