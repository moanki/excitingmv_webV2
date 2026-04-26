import Link from "next/link";
import { notFound } from "next/navigation";

import { ResourceEditorForm } from "@/components/admin/resource-editor-form";
import { listResources } from "@/lib/services/resource-service";

export default async function AdminResourceEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resources = await listResources();
  const resource = resources.find((item) => item.id === id);

  if (!resource) {
    notFound();
  }

  return (
    <section className="stack">
      <div className="admin-page-header">
        <div className="admin-page-header__content">
          <Link href="/admin/resources" className="admin-back-link">
            Back to Resource Library
          </Link>
          <h1 className="section-title">Edit Resource</h1>
        </div>
      </div>
      <article className="panel">
        <ResourceEditorForm resource={resource} />
      </article>
    </section>
  );
}
