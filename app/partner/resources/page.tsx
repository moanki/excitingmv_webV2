import { ResourceAccessPanel } from "@/app/partner/resources/resource-access-panel";
import { getResourceAccessSession } from "@/lib/partner-resource-access";
import { listPublishedResources } from "@/lib/services/resource-service";

export default async function PartnerResourcesPage({
  searchParams
}: {
  searchParams: Promise<{ access?: string }>;
}) {
  const [session, params] = await Promise.all([getResourceAccessSession(), searchParams]);
  const hasAccess = Boolean(session);
  const resources = await listPublishedResources(session?.agentId);

  const safeResources = resources.map(({ id, title, description, resourceType, audienceType }) => ({
    id,
    title,
    description,
    resourceType,
    audienceType
  }));
  const openOnLoad = !hasAccess && (!params.access || params.access === "required");

  return (
    <section className="partner-resources-page">
      <div className="partner-resources-hero">
        <p className="eyebrow">Resources</p>
        <h1 className="section-title">Rates, offers, kits, and collateral.</h1>
        <p>
          Enter your partner email and the password provided by our team to unlock the shared partner resource library.
        </p>
      </div>

      {!hasAccess ? (
        <div className="partner-resource-locked-state" aria-live="polite">
          <strong>Resources are locked.</strong>
          <span>Unlock access to view and download protected files.</span>
        </div>
      ) : null}

      <ResourceAccessPanel resources={safeResources} hasAccess={hasAccess} openOnLoad={openOnLoad} />
    </section>
  );
}
