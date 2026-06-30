export function AdminRouteLoading() {
  return (
    <div className="admin-route-loading" role="status" aria-label="Loading admin page">
      <div className="admin-skeleton admin-skeleton--title" />
      <div className="admin-skeleton-cards">
        {Array.from({ length: 3 }, (_, index) => <div className="admin-skeleton admin-skeleton-card" key={index} />)}
      </div>
      <div className="admin-skeleton-table">
        {Array.from({ length: 6 }, (_, index) => <div className="admin-skeleton admin-skeleton-row" key={index} />)}
      </div>
    </div>
  );
}
