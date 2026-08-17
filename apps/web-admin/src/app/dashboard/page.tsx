import AdminShell from '@/components/AdminShell';
import { apiFetch } from '@/lib/api';

// Admin-only endpoint (Sprint 9's AdminService.stats) — a moderator-only
// account will get a 403 here, which this page treats as "no stats visible,"
// not an error page, since a moderator's job (the queue) doesn't need them.
export default async function DashboardPage() {
  let stats: any = null;
  try {
    stats = await apiFetch('/admin/stats');
  } catch {
    // 403 for moderator-only accounts, or a transient API issue — either way,
    // fall through to the moderator-focused view below instead of crashing.
  }

  return (
    <AdminShell>
      <h2>Dashboard</h2>
      {stats ? (
        <div className="stat-grid">
          <Stat label="Total Users" value={stats.totalUsers} />
          <Stat label="Daily Active" value={stats.dailyActiveUsers} />
          <Stat label="Monthly Active" value={stats.monthlyActiveUsers} />
          <Stat label="Live Rooms Now" value={stats.activeLiveRooms} />
          <Stat label="Prayer Requests" value={stats.totalPrayerRequests} />
          <Stat label="Groups" value={stats.totalGroups} />
          <Stat label="Organizations" value={stats.totalOrganizations} />
          <Stat label="Open Reports" value={stats.openModerationCases} />
        </div>
      ) : (
        <div className="card">
          <p>Platform stats require the admin or super_admin role. You can still access the
             Moderation Queue if you hold the moderator role.</p>
        </div>
      )}
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
