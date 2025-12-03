import { AdminBreadcrumbs } from '@/components/admin/admin-breadcrumbs';
import { QuickActions } from '@/components/admin/quick-actions';
import { RecentSubmissions } from '@/components/admin/recent-submissions';
import { StatsCards } from '@/components/admin/stats-cards';
import { getAdminStats, getRecentSubmissions } from '@/lib/admin/dashboard';

export default async function AdminDashboard() {
  const [stats, submissions] = await Promise.all([getAdminStats(), getRecentSubmissions(5)]);

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
          <RecentSubmissions submissions={submissions} />
        </div>
        <QuickActions />
      </div>
    </div>
  );
}
