import { notFound } from "next/navigation";

import { ResortEditor } from "@/app/admin/resorts/forms";
import { getAdminResortById } from "@/lib/services/resort-service";
import { listSiteAssets } from "@/lib/storage/site-assets";

const labels = {
  singular: "Liveaboard",
  plural: "Liveaboards",
  publicBasePath: "/liveaboards",
  adminBasePath: "/admin/liveaboards"
};

export default async function EditAdminLiveaboardPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [liveaboard, mediaLibrary] = await Promise.all([getAdminResortById(id), listSiteAssets()]);

  if (!liveaboard || liveaboard.propertyType !== "liveaboards") {
    notFound();
  }

  return (
    <ResortEditor
      resort={liveaboard}
      title="Edit Liveaboard"
      description="Work on one selected liveaboard with dedicated sections for content, cabins, media, and publishing."
      mediaLibrary={mediaLibrary}
      mode="edit"
      propertyType="liveaboards"
      labels={labels}
    />
  );
}
