import { getResortCounts } from "@/lib/services/resort-service";
import { listAdminUsers } from "@/lib/services/admin-user-service";
import { listChatConversations } from "@/lib/services/chat-service";
import { listImportBatches } from "@/lib/services/import-service";
import { listNewsletterSubmissions } from "@/lib/services/newsletter-service";
import { listPartnerRequests } from "@/lib/services/partner-service";
import { listResources } from "@/lib/services/resource-service";

export default async function AdminDashboardPage() {
  const [counts, partners, newsletters, chats, imports, resources, users] = await Promise.all([
    getResortCounts(),
    listPartnerRequests(),
    listNewsletterSubmissions(),
    listChatConversations(),
    listImportBatches(),
    listResources(),
    listAdminUsers()
  ]);

  const unreadChats = chats.filter((conversation) => conversation.status === "open").length;
  const pendingPartners = partners.filter((partner) => partner.status === "pending").length;
  const draftResorts = counts.draft;
  const pendingImports = imports.filter((batch) => batch.status !== "completed").length;
  const stats = [
    { label: "Partner Requests", value: String(pendingPartners), meta: "Awaiting review" },
    { label: "Unread Chats", value: String(unreadChats), meta: "Open conversations" },
    { label: "Draft Resorts", value: String(draftResorts), meta: "Need publish review" },
    { label: "Imports In Flight", value: String(pendingImports), meta: "Queued or processing" }
  ];

  const activity = [
    {
      label: "New newsletter leads",
      value: newsletters.length,
      href: "/admin/newsletters",
      note: "Recent lead capture records ready for export or follow-up."
    },
    {
      label: "Protected resources",
      value: resources.length,
      href: "/admin/resources",
      note: "Files and sales materials currently managed in the resource library."
    },
    {
      label: "Admin users",
      value: users.length,
      href: "/admin/user-access",
      note: "Internal users with active workspace access."
    }
  ];

  const quickActions = [
    { label: "Review partner approvals", href: "/admin/partners" },
    { label: "Add or update a resort", href: "/admin/resorts" },
    { label: "Open AI Import Center", href: "/admin/imports" },
    { label: "Manage user access", href: "/admin/user-access" }
  ];

  return (
    <section className="stack">
      <div className="admin-hero-card">
        <div>
          <p className="eyebrow">Operations Dashboard</p>
          <h1 className="section-title">A cleaner control center for approvals, content, and trade support.</h1>
          <p className="muted">
            Start with what needs attention, then move into content operations, imports, leads,
            and access control without leaving the admin workspace.
          </p>
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid-quad">
        {stats.map((stat) => (
          <article key={stat.label} className="stat-card">
            <p className="admin-stat-label">{stat.label}</p>
            <strong>{stat.value}</strong>
            <span>{stat.meta}</span>
          </article>
        ))}
      </div>

      <div className="admin-overview-grid">
        <article className="panel admin-panel-section">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Recent Signals</p>
              <h2>What changed recently</h2>
            </div>
          </div>
          <div className="admin-activity-list">
            {activity.map((item) => (
              <a key={item.label} href={item.href} className="admin-activity-item">
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.note}</p>
                </div>
                <span>{item.value}</span>
              </a>
            ))}
          </div>
        </article>

        <article className="panel admin-panel-section">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Quick Actions</p>
              <h2>Common admin tasks</h2>
            </div>
          </div>
          <div className="admin-action-list">
            {quickActions.map((action) => (
              <a key={action.href} href={action.href} className="button-muted admin-action-link">
                {action.label}
              </a>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
