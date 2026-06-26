import { listAdminUsers } from "@/lib/services/admin-user-service";
import { listNewsletterSubmissions } from "@/lib/services/newsletter-service";
import { listPartnerRequests } from "@/lib/services/partner-service";
import { listResourcePermissions } from "@/lib/services/resource-permission-service";
import { listResources } from "@/lib/services/resource-service";
import { getResortCounts, listAdminResortCards } from "@/lib/services/resort-service";
import { listSiteAssets } from "@/lib/storage/site-assets";

export default async function AdminDashboardPage() {
  const [resortCounts, hotelCounts, liveaboardCounts, recentResorts, partners, newsletters, resources, users, permissions, mediaAssets] = await Promise.all([
    getResortCounts(),
    getResortCounts("hotels"),
    getResortCounts("liveaboards"),
    listAdminResortCards("resort", 6),
    listPartnerRequests(),
    listNewsletterSubmissions(),
    listResources(),
    listAdminUsers(),
    listResourcePermissions(),
    listSiteAssets().catch(() => [])
  ]);

  const stats = [
    {
      label: "Total Resorts",
      value: resortCounts.total,
      sub: `${resortCounts.published} published · ${resortCounts.draft} draft`,
      trend: "Portfolio live",
      trendTone: "stat-up",
      href: "/admin/resorts"
    },
    {
      label: "Hotels",
      value: hotelCounts.total,
      sub: `${hotelCounts.published} published · ${hotelCounts.draft} draft`,
      trend: hotelCounts.total ? "Active channel" : "Ready to build",
      trendTone: hotelCounts.total ? "stat-up" : "",
      href: "/admin/hotels"
    },
    {
      label: "Liveaboards",
      value: liveaboardCounts.total,
      sub: `${liveaboardCounts.published} published · ${liveaboardCounts.draft} draft`,
      trend: liveaboardCounts.total ? "Voyages tracked" : "No change",
      trendTone: liveaboardCounts.total ? "stat-up" : "",
      href: "/admin/liveaboards"
    },
    {
      label: "Media Assets",
      value: mediaAssets.length,
      sub: "Images & videos",
      trend: `${resources.length} resources`,
      trendTone: "stat-up",
      href: "/admin/media"
    }
  ];

  const totalPortfolio = Math.max(resortCounts.total + hotelCounts.total + liveaboardCounts.total, 1);
  const portfolioBreakdown = [
    { label: "Resorts", value: resortCounts.total, width: `${Math.round((resortCounts.total / totalPortfolio) * 100)}%` },
    { label: "Hotels", value: hotelCounts.total, width: `${Math.round((hotelCounts.total / totalPortfolio) * 100)}%` },
    { label: "Liveaboards", value: liveaboardCounts.total, width: `${Math.round((liveaboardCounts.total / totalPortfolio) * 100)}%` },
    { label: "Partner Leads", value: partners.filter((partner) => partner.status === "pending").length, width: `${Math.min(100, partners.length * 10)}%` },
    { label: "Newsletter Leads", value: newsletters.length, width: `${Math.min(100, newsletters.length * 8)}%` }
  ];

  const transferBreakdown = ["Seaplane", "Speedboat", "Domestic"].map((transfer) => {
    const matches = recentResorts.filter((resort) => resort.transferType.toLowerCase().includes(transfer.toLowerCase())).length;
    return {
      label: transfer,
      value: recentResorts.length ? `${Math.round((matches / recentResorts.length) * 100)}%` : "0%"
    };
  });

  const activityItems = recentResorts.map((resort) => ({
    label: resort.name,
    description:
      resort.status === "published"
        ? "is published in the portfolio"
        : resort.status === "archived"
          ? "is currently archived"
          : "is saved as draft",
    tone: resort.status === "published" ? "published" : resort.status === "archived" ? "deleted" : "draft",
    time: resort.updatedAt ? `Updated ${new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(resort.updatedAt))}` : "Recently"
  }));

  const fallbackActivity = [
    {
      label: `${partners.filter((partner) => partner.status === "pending").length} partner requests`,
      description: "waiting for review",
      tone: "updated",
      time: "Live queue"
    },
    {
      label: `${permissions.filter((permission) => permission.status === "active").length} active partner access records`,
      description: "available in permissions",
      tone: "published",
      time: "Workspace"
    },
    {
      label: `${users.length} admin users`,
      description: "configured in access control",
      tone: "updated",
      time: "Team"
    }
  ];

  return (
    <section className="stack">
      <div className="admin-page-intro">
        <h1>Dashboard</h1>
        <p>Portfolio, partner activity, and CMS health at a glance.</p>
      </div>

      <div className="stat-grid cms-dashboard-stats">
        {stats.map((stat) => (
          <a key={stat.label} href={stat.href} className="stat-card stat-card-link cms-stat-card">
            <div className="stat-label">{stat.label}</div>
            <div className="stat-num">{stat.value}</div>
            <div className="stat-sub">{stat.sub}</div>
            <div className={stat.trendTone ? `stat-trend ${stat.trendTone}` : "stat-trend"}>{stat.trend}</div>
          </a>
        ))}
      </div>

      <div className="dash-grid cms-dashboard-grid">
        <article className="panel cms-panel">
          <div className="panel-head">
            <div className="panel-title">Recent Activity</div>
            <a href="/admin/resorts" className="panel-link">View all</a>
          </div>
          <div className="cms-activity-list">
            {(activityItems.length ? activityItems : fallbackActivity).slice(0, 6).map((item, index) => (
              <div className="activity-item" key={`${item.label}-${index}`}>
                <div className={`act-dot ${item.tone}`} aria-hidden="true" />
                <div>
                  <div className="act-text"><strong>{item.label}</strong> {item.description}</div>
                  <div className="act-time">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel cms-panel">
          <div className="panel-head">
            <div className="panel-title">Portfolio Breakdown</div>
          </div>
          <div className="cms-quick-stats">
            {portfolioBreakdown.map((item) => (
              <div className="qs-row" key={item.label}>
                <div>
                  <div className="qs-label">{item.label}</div>
                  <div className="qs-bar"><div className="qs-fill" style={{ width: item.width }} /></div>
                </div>
                <div className="qs-val">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="cms-transfer-split">
            <div className="panel-title">Transfer Split</div>
            {transferBreakdown.map((item) => (
              <div className="qs-row" key={item.label}>
                <div className="qs-label">{item.label}</div>
                <div className="qs-val is-teal">{item.value}</div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
