import { listRoles } from "@/lib/services/admin-user-service";

const roleDetails: Record<string, string> = {
  super_admin: "Full access across content, users, roles, imports, resources, and operational settings.",
  admin: "Operational access for content, partner requests, resources, newsletters, chat, and imports.",
  content_manager: "Focused access for content editing, property management, and import review workflows."
};

export default async function AdminRolesPage() {
  const roles = await listRoles();

  return (
    <section className="stack">
      <div>
        <p className="eyebrow">Roles</p>
        <h1 className="section-title">Predefined admin roles and what they can access.</h1>
      </div>
      <div className="grid">
        {roles.map((role) => (
          <article className="card" key={role.id}>
            <span className="badge">{role.name}</span>
            <h2>{role.name.replace(/_/g, " ")}</h2>
            <p className="muted">{roleDetails[role.name] ?? role.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
