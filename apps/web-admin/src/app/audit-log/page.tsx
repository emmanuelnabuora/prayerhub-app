import AdminShell from '@/components/AdminShell';
import { apiFetch } from '@/lib/api';

// Read-only, and deliberately so — every sensitive admin action across the
// whole app (role grants/revokes, organization verification, moderation
// resolutions, room removals) writes to the same audit_logs table from
// migration 0001, so this one page is a complete trail rather than one of
// several scattered logs.
export default async function AuditLogPage() {
  const logs = await apiFetch('/admin/audit-logs?limit=100');

  return (
    <AdminShell>
      <h2>Audit Log</h2>
      <table style={{ marginTop: 16 }}>
        <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Target</th><th>Reason</th></tr></thead>
        <tbody>
          {logs.map((log: any) => (
            <tr key={log.id}>
              <td>{new Date(log.created_at).toLocaleString()}</td>
              <td>{log.actor_name ?? '—'}</td>
              <td>{log.action}</td>
              <td>{log.target_type ?? '—'}</td>
              <td>{log.reason ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminShell>
  );
}
