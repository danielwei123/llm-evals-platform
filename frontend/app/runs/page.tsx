import Link from 'next/link';

import { listRuns } from '@/lib/runsApi';

export default async function RunsPage() {
  const runs = await listRuns({ limit: 100, offset: 0 });

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Runs</h1>
      <p>Queue-only v0 list view.</p>

      <p>
        <Link href="/prompts">Prompt Registry</Link>
      </p>

      <p>
        <Link href="/runs/new">Queue a run</Link>
      </p>

      {runs.length === 0 ? (
        <p>No runs yet.</p>
      ) : (
        <ul>
          {runs.map((r) => (
            <li key={r.id} style={{ marginBottom: 12 }}>
              <div>
                <Link href={`/runs/${r.id}`}>
                  <strong>{r.status}</strong>
                </Link>{' '}
                <span style={{ color: '#666' }}>
                  (prompt v{r.prompt_version})
                </span>
              </div>
              <div style={{ color: '#666', fontSize: 12 }}>
                {new Date(r.created_at).toLocaleString()} • {r.id}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
