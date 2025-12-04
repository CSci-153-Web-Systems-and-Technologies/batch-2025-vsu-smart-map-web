import { AdminBreadcrumbs } from '@/components/admin/admin-breadcrumbs';
import { QuickActions } from '@/components/admin/quick-actions';
import { RecentActivity } from '@/components/admin/recent-activity';
import { StatsCards } from '@/components/admin/stats-cards';
import { getAdminStats, getRecentSubmissions } from '@/lib/admin/dashboard';

export default async function AdminDashboard() {
  const [stats, submissions] = await Promise.all([getAdminStats(), getRecentSubmissions(10)]);

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of facilities, rooms, and submissions.
          </p>
        </div>
      </div>

      <StatsCards stats={stats} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <RecentActivity submissions={submissions} />
        </div>
        <QuickActions />
      </div>
    </div>
  );
}
