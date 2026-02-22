'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { createRun } from '@/lib/runsApi';

export function QueueRunClient() {
  const router = useRouter();

  const [promptName, setPromptName] = useState('');
  const [inputJson, setInputJson] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <section style={{ padding: 12, border: '1px solid #ddd' }}>
      {error ? (
        <div style={{ padding: 12, background: '#fee', border: '1px solid #f99', marginBottom: 12 }}>
          <strong>Error:</strong> {error}
        </div>
      ) : null}

      <label style={{ display: 'grid', gap: 8 }}>
        <div style={{ fontWeight: 600 }}>Prompt name</div>
        <input
          value={promptName}
          onChange={(e) => setPromptName(e.target.value)}
          placeholder="e.g. support_reply"
          style={{ width: '100%', padding: 8 }}
        />
      </label>

      <label style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        <div style={{ fontWeight: 600 }}>Input (JSON, optional)</div>
        <textarea
          value={inputJson}
          onChange={(e) => setInputJson(e.target.value)}
          rows={8}
          style={{ width: '100%', padding: 8, fontFamily: 'ui-monospace, Menlo, monospace' }}
          placeholder='{"ticket_id": "123", "message": "hello"}'
        />
      </label>

      <button
        disabled={submitting}
        onClick={async () => {
          setError(null);
          setSubmitting(true);
          try {
            const trimmed = inputJson.trim();
            const input = trimmed.length === 0 ? null : JSON.parse(trimmed);
            const run = await createRun({
              prompt_name: promptName.trim(),
              input,
            });
            router.push(`/runs/${run.id}`);
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
          } finally {
            setSubmitting(false);
          }
        }}
        style={{ padding: '8px 12px', marginTop: 12 }}
      >
        {submitting ? 'Queuing…' : 'Queue run'}
      </button>

      <p style={{ color: '#666', fontSize: 12, marginTop: 12 }}>
        Note: runner execution is not wired yet; this just creates a queued run record.
      </p>
    </section>
  );
}
