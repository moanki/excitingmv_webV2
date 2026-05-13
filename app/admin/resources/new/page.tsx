import Link from "next/link";

import { ResourceEditorForm } from "@/components/admin/resource-editor-form";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function AdminResourceNewPage() {
  const mediaLibrary = await listSiteAssets();

  return (
    <section className="stack">
      <div className="admin-page-header">
        <div className="admin-page-header__content">
          <Link href="/admin/resources" className="admin-back-link">
            Back to Resource Library
          </Link>
          <h1 className="section-title">Add Resource</h1>
        </div>
      </div>
      <article className="panel">
        <ResourceEditorForm mediaLibrary={mediaLibrary} />
      </article>
    </section>
  );
}
