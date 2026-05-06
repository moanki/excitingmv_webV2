import { listImportCheckpoints } from "@/lib/services/import-service";
import { ImportCenterForms } from "@/app/admin/imports/import-form";

export default async function AdminImportsPage() {
  const checkpoints = await listImportCheckpoints();

  return (
    <section className="stack">
      <ImportCenterForms checkpoints={checkpoints} />
    </section>
  );
}
