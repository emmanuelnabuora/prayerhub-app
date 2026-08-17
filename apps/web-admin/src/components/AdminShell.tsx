import Link from 'next/link';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <h1>PrayerHubApp</h1>
        <nav>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/moderation">Moderation Queue</Link>
          <Link href="/organizations">Organizations</Link>
          <Link href="/users">Users & Roles</Link>
          <Link href="/audit-log">Audit Log</Link>
        </nav>
        <form action="/logout" method="POST" style={{ marginTop: 24 }}>
          <button type="submit" className="secondary" style={{ width: '100%' }}>Sign out</button>
        </form>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
