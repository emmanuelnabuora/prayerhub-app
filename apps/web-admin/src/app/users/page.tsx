import AdminShell from '@/components/AdminShell';
import { apiFetch } from '@/lib/api';
import { grantRole, revokeRole } from './actions';

export default async function UsersPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q ?? '';
  const users = q ? await apiFetch(`/admin/users?q=${encodeURIComponent(q)}`) : [];

  return (
    <AdminShell>
      <h2>Users & Roles</h2>
      <form style={{ marginTop: 16, marginBottom: 16 }}>
        <input name="q" defaultValue={q} placeholder="Search by name, username, or email…" />
      </form>

      {q && users.length === 0 && <div className="card">No users match "{q}".</div>}

      {users.map((u: any) => (
        <div className="card" key={u.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <strong>{u.display_name}</strong> <span style={{ color: 'var(--muted)' }}>@{u.username}</span>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{u.email}</div>
              <div style={{ marginTop: 6 }}>
                {u.roles.length === 0 && <span style={{ fontSize: 12, color: 'var(--muted)' }}>member (no elevated roles)</span>}
                {u.roles.map((r: string) => (
                  <span key={r} style={{ marginRight: 6 }}>
                    <span className="badge badge-low">{r}</span>{' '}
                    {r !== 'member' && (
                      <form action={revokeRole} style={{ display: 'inline' }}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="role" value={r} />
                        <button type="submit" className="secondary" style={{ padding: '2px 8px', fontSize: 11 }}>revoke</button>
                      </form>
                    )}
                  </span>
                ))}
              </div>
            </div>
            <form action={grantRole} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="hidden" name="userId" value={u.id} />
              <select name="role" style={{ padding: 6, borderRadius: 8, border: '1px solid var(--border)' }}>
                <option value="moderator">moderator</option>
                <option value="admin">admin</option>
                <option value="super_admin">super_admin</option>
              </select>
              <button type="submit" className="secondary">Grant</button>
            </form>
          </div>
        </div>
      ))}
    </AdminShell>
  );
}
