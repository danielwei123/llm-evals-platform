'use client';

import { getApiBase } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

export function NewVersionForm({ promptId }: { promptId: string }) {
  const router = useRouter();
  const apiBase = useMemo(() => getApiBase(), []);

  const [content, setContent] = useState('');
  const [parametersJson, setParametersJson] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    let parameters: unknown = null;
    if (parametersJson.trim().length > 0) {
      try {
        parameters = JSON.parse(parametersJson);
      } catch {
        setSubmitting(false);
        setError('Parameters must be valid JSON (or blank).');
        return;
      }
    }

    const res = await fetch(`${apiBase}/api/prompts/${promptId}/versions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        content,
        parameters,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      setSubmitting(false);
      setError(`Create version failed: ${res.status} ${text}`);
      return;
    }

    setContent('');
    setParametersJson('');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} style={{ marginTop: 16 }}>
      <h3 style={{ marginBottom: 8 }}>Create new version</h3>

      <div style={{ marginBottom: 12 }}>
        <label>
          <div>Content</div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={8}
            placeholder="You are helpful..."
            style={{
              width: '100%',
              padding: 8,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>
          <div>Parameters (JSON)</div>
          <textarea
            value={parametersJson}
            onChange={(e) => setParametersJson(e.target.value)}
            rows={5}
            placeholder={'{\n  "temperature": 0.2\n}'}
            style={{
              width: '100%',
              padding: 8,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          />
        </label>
        <div style={{ color: '#666', fontSize: 12, marginTop: 6 }}>
          Leave blank for null.
        </div>
      </div>

      {error ? (
        <div style={{ marginBottom: 12, color: '#b00020' }}>
          <strong>Error:</strong> {error}
        </div>
      ) : null}

      <button type="submit" disabled={submitting} style={{ padding: '8px 12px' }}>
        {submitting ? 'Creating…' : 'Create version'}
      </button>
    </form>
  );
}
