import Link from 'next/link';

import { getRun } from '@/lib/runsApi';

function toJsonPretty(obj: unknown): string {
  if (obj == null) return '';
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

export default async function RunDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const run = await getRun(params.id);

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <p>
        <Link href="/runs">← Back to runs</Link>
      </p>

      <h1 style={{ marginBottom: 4 }}>Run</h1>
      <div style={{ color: '#666', fontSize: 12 }}>
        Status: <strong>{run.status}</strong> • Prompt v{run.prompt_version}
      </div>

      <section style={{ marginTop: 16, padding: 12, border: '1px solid #ddd' }}>
        <h2 style={{ marginTop: 0 }}>IDs</h2>
        <div style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12 }}>
          <div>run_id: {run.id}</div>
          <div>prompt_id: {run.prompt_id}</div>
        </div>
      </section>

      <section style={{ marginTop: 16, padding: 12, border: '1px solid #ddd' }}>
        <h2 style={{ marginTop: 0 }}>Input</h2>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            background: '#fff',
            border: '1px solid #eee',
            padding: 10,
            fontSize: 12,
            overflowX: 'auto',
          }}
        >
          {toJsonPretty(run.input)}
        </pre>
      </section>

      <section style={{ marginTop: 16, padding: 12, border: '1px solid #ddd' }}>
        <h2 style={{ marginTop: 0 }}>Output</h2>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            background: '#fff',
            border: '1px solid #eee',
            padding: 10,
            fontSize: 12,
            overflowX: 'auto',
          }}
        >
          {run.output ?? '—'}
        </pre>
      </section>

      <section style={{ marginTop: 16, padding: 12, border: '1px solid #ddd' }}>
        <h2 style={{ marginTop: 0 }}>Error</h2>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            background: '#fff',
            border: '1px solid #eee',
            padding: 10,
            fontSize: 12,
            overflowX: 'auto',
          }}
        >
          {run.error ?? '—'}
        </pre>
      </section>
    </main>
  );
}
