'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { getApiBase } from '@/lib/api';

export default function NewPromptPage() {
  const router = useRouter();
  const apiBase = useMemo(() => getApiBase(), []);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [parametersJson, setParametersJson] = useState('{\n  "temperature": 0.2\n}');

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
      } catch (err) {
        setSubmitting(false);
        setError('Parameters must be valid JSON (or blank).');
        return;
      }
    }

    const res = await fetch(`${apiBase}/api/prompts`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name,
        description: description.trim().length ? description : null,
        content,
        parameters,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      setSubmitting(false);
      setError(`Create failed: ${res.status} ${text}`);
      return;
    }

    router.push('/prompts');
    router.refresh();
  }

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 860 }}>
      <h1>New Prompt</h1>
      <p style={{ color: '#666' }}>
        Creates a prompt + version 1. (Versioning UI next.)
      </p>

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>
            <div>Name</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="support_reply"
              style={{ width: '100%', padding: 8 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            <div>Description</div>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tone + structure for support"
              style={{ width: '100%', padding: 8 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            <div>Content</div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={10}
              placeholder="You are helpful..."
              style={{ width: '100%', padding: 8, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            <div>Parameters (JSON)</div>
            <textarea
              value={parametersJson}
              onChange={(e) => setParametersJson(e.target.value)}
              rows={6}
              style={{ width: '100%', padding: 8, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
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
          {submitting ? 'Creating…' : 'Create prompt'}
        </button>
      </form>

      <hr style={{ margin: '24px 0' }} />
      <p style={{ color: '#666' }}>
        API base: <code>{apiBase}</code>
      </p>
    </main>
  );
}
