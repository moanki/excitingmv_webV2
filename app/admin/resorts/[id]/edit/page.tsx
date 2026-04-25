import { notFound } from "next/navigation";

import { ResortEditor } from "@/app/admin/resorts/forms";
import { getAdminResortById } from "@/lib/services/resort-service";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function EditAdminResortPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [resort, mediaLibrary] = await Promise.all([getAdminResortById(id), listSiteAssets()]);

  if (!resort) {
    notFound();
  }

  return (
    <ResortEditor
      resort={resort}
      title="Edit Resort"
      description="Work on one selected resort at a time with dedicated sections for content, rooms, media, and publishing."
      mediaLibrary={mediaLibrary}
      mode="edit"
    />
  );
}
