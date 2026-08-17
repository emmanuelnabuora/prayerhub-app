import AdminShell from '@/components/AdminShell';
import { apiFetch } from '@/lib/api';
import { resolveCase } from './actions';

export default async function ModerationPage() {
  const cases = await apiFetch('/admin/moderation/queue?status=open');

  return (
    <AdminShell>
      <h2>Moderation Queue</h2>
      <p style={{ color: 'var(--muted)', marginBottom: 20, fontSize: 13 }}>
        AI-suggested severity is advisory only — every case here requires a human decision
        below before it's resolved.
      </p>

      {cases.length === 0 && <div className="card">No open reports. 🎉</div>}

      {cases.map((c: any) => (
        <div className="card" key={c.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>
              <strong>{c.target_type}</strong> reported — {c.reason}
            </span>
            {c.ai_suggested_severity && (
              <span className={`badge badge-${c.ai_suggested_severity}`}>{c.ai_suggested_severity}</span>
            )}
          </div>
          {c.ai_suggested_action && (
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>
              <strong>AI suggestion:</strong> {c.ai_suggested_action}
            </p>
          )}
          {c.ai_rationale && (
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>{c.ai_rationale}</p>
          )}
          <form action={resolveCase} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="hidden" name="caseId" value={c.id} />
            <input name="resolutionNotes" placeholder="Resolution notes (required)" required style={{ flex: 1, marginBottom: 0 }} />
            <button type="submit" name="status" value="resolved">Resolve</button>
            <button type="submit" name="status" value="dismissed" className="secondary">Dismiss</button>
          </form>
        </div>
      ))}
    </AdminShell>
  );
}
