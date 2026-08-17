import AdminShell from '@/components/AdminShell';
import { apiFetch } from '@/lib/api';
import { verifyOrganization } from './actions';

export default async function OrganizationsPage() {
  const orgs = await apiFetch('/organizations');
  const unverified = orgs.filter((o: any) => !o.verified);
  const verified = orgs.filter((o: any) => o.verified);

  return (
    <AdminShell>
      <h2>Organizations</h2>

      <h3 style={{ fontSize: 15, marginTop: 20, marginBottom: 8 }}>Pending Verification</h3>
      {unverified.length === 0 && <div className="card">Nothing pending review.</div>}
      {unverified.map((org: any) => (
        <div className="card" key={org.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>{org.name}</strong>
            <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase' }}>{org.type}</div>
          </div>
          <form action={verifyOrganization}>
            <input type="hidden" name="orgId" value={org.id} />
            <button type="submit">Verify</button>
          </form>
        </div>
      ))}

      <h3 style={{ fontSize: 15, marginTop: 28, marginBottom: 8 }}>Verified</h3>
      <table>
        <thead><tr><th>Name</th><th>Type</th><th>Followers</th><th>Groups</th></tr></thead>
        <tbody>
          {verified.map((org: any) => (
            <tr key={org.id}>
              <td>{org.name} <span className="badge badge-verified">✓</span></td>
              <td>{org.type}</td>
              <td>{org.followerCount}</td>
              <td>{org.groupCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminShell>
  );
}
