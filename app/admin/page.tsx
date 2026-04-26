import { listAdminUsers } from "@/lib/services/admin-user-service";
import { listChatConversations } from "@/lib/services/chat-service";
import { listNewsletterSubmissions } from "@/lib/services/newsletter-service";
import { listPartnerRequests } from "@/lib/services/partner-service";
import { listResourcePermissions } from "@/lib/services/resource-permission-service";
import { listResources } from "@/lib/services/resource-service";
import { getResortCounts } from "@/lib/services/resort-service";

export default async function AdminDashboardPage() {
  const [counts, partners, newsletters, chats, resources, users, permissions] = await Promise.all([
    getResortCounts(),
    listPartnerRequests(),
    listNewsletterSubmissions(),
    listChatConversations(),
    listResources(),
    listAdminUsers(),
    listResourcePermissions()
  ]);

  const stats = [
    { label: "Pending Partners", value: String(partners.filter((partner) => partner.status === "pending").length), href: "/admin/partners" },
    { label: "Newsletter Leads", value: String(newsletters.length), href: "/admin/newsletters" },
    { label: "Published Resorts", value: String(counts.published), href: "/admin/resorts" },
    { label: "Draft Resorts", value: String(counts.draft), href: "/admin/resorts" },
    { label: "Resources", value: String(resources.length), href: "/admin/resources" },
    {
      label: "Active Partner Access",
      value: String(permissions.filter((permission) => permission.status === "active").length),
      href: "/admin/resource-permissions"
    }
  ];

  const quickActions = [
    { label: "Add Resort", href: "/admin/resorts/new" },
    { label: "Add Resource", href: "/admin/resources/new" },
    { label: "Review Partners", href: "/admin/partners" },
    { label: "View Newsletter Leads", href: "/admin/newsletters" }
  ];

  return (
    <section className="stack">
      <div className="admin-page-header">
        <div className="admin-page-header__content">
          <h1 className="section-title">Admin Dashboard</h1>
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid-quad">
        {stats.map((stat) => (
          <a key={stat.label} href={stat.href} className="stat-card stat-card-link">
            <p className="admin-stat-label">{stat.label}</p>
            <strong>{stat.value}</strong>
          </a>
        ))}
      </div>

      <div className="admin-overview-grid">
        <article className="panel admin-panel-section">
          <div className="section-heading compact">
            <div>
              <h2>Quick Actions</h2>
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

        <article className="panel admin-panel-section">
          <div className="section-heading compact">
            <div>
              <h2>Workspace</h2>
            </div>
          </div>
          <div className="admin-activity-list">
            <a href="/admin/chat" className="admin-activity-item">
              <div>
                <strong>Open conversations</strong>
              </div>
              <span>{chats.filter((conversation) => conversation.status === "open").length}</span>
            </a>
            <a href="/admin/user-access" className="admin-activity-item">
              <div>
                <strong>Admin users</strong>
              </div>
              <span>{users.length}</span>
            </a>
          </div>
        </article>
      </div>
    </section>
  );
}
