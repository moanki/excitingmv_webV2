import { listRoles } from "@/lib/services/admin-user-service";

const roleDetails: Record<string, { description: string; permissions: string[] }> = {
  super_admin: {
    description: "Full access across content, users, roles, imports, resources, and operational settings.",
    permissions: ["All content", "Users and roles", "Imports", "Resources", "Settings"]
  },
  admin: {
    description: "Operational access for content, partner requests, resources, newsletters, chat, and imports.",
    permissions: ["Content", "Partners", "Resources", "Newsletters", "Chat"]
  },
  content_manager: {
    description: "Focused access for content editing, property management, and import review workflows.",
    permissions: ["Properties", "Imports", "Homepage content"]
  }
};

export default async function AdminRolesPage() {
  const roles = await listRoles();

  return (
    <section className="stack">
      <div className="admin-page-header">
        <div className="admin-page-header__content">
          <p className="eyebrow">Roles</p>
          <h1 className="section-title">Predefined admin roles and what they can access.</h1>
          <p className="admin-page-lede">Communicate permission boundaries more clearly for internal teams.</p>
        </div>
      </div>
      <div className="grid">
        {roles.map((role) => (
          <article className="card admin-role-card" key={role.id}>
            <span className="badge">{role.name}</span>
            <h2>{role.name.replace(/_/g, " ")}</h2>
            <p className="muted">{roleDetails[role.name]?.description ?? role.description}</p>
            <ul className="admin-role-permissions">
              {(roleDetails[role.name]?.permissions ?? []).map((permission) => (
                <li key={permission}>{permission}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
