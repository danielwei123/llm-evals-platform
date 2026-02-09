'use client';

import { useState } from 'react';

export type PromptFormValue = {
  name: string;
  description: string;
  content: string;
  parametersJson: string;
};

export function PromptForm({
  submitLabel,
  initialValue,
  onSubmit,
}: {
  submitLabel: string;
  initialValue?: Partial<PromptFormValue>;
  onSubmit: (value: PromptFormValue) => Promise<void>;
}) {
  const [value, setValue] = useState<PromptFormValue>({
    name: initialValue?.name ?? '',
    description: initialValue?.description ?? '',
    content: initialValue?.content ?? '',
    parametersJson: initialValue?.parametersJson ?? '{\n  \n}',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
          await onSubmit(value);
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setSubmitting(false);
        }
      }}
      style={{ display: 'grid', gap: 12, maxWidth: 720 }}
    >
      {error ? (
        <div style={{ padding: 12, background: '#fee', border: '1px solid #f99' }}>
          <strong>Error:</strong> {error}
        </div>
      ) : null}

      <label>
        <div style={{ fontWeight: 600 }}>Name</div>
        <input
          value={value.name}
          onChange={(e) => setValue((v) => ({ ...v, name: e.target.value }))}
          required
          style={{ width: '100%', padding: 8 }}
        />
      </label>

      <label>
        <div style={{ fontWeight: 600 }}>Description</div>
        <input
          value={value.description}
          onChange={(e) => setValue((v) => ({ ...v, description: e.target.value }))}
          style={{ width: '100%', padding: 8 }}
        />
      </label>

      <label>
        <div style={{ fontWeight: 600 }}>Content</div>
        <textarea
          value={value.content}
          onChange={(e) => setValue((v) => ({ ...v, content: e.target.value }))}
          required
          rows={10}
          style={{ width: '100%', padding: 8, fontFamily: 'ui-monospace, Menlo, monospace' }}
        />
      </label>

      <label>
        <div style={{ fontWeight: 600 }}>Parameters (JSON)</div>
        <textarea
          value={value.parametersJson}
          onChange={(e) => setValue((v) => ({ ...v, parametersJson: e.target.value }))}
          rows={8}
          style={{ width: '100%', padding: 8, fontFamily: 'ui-monospace, Menlo, monospace' }}
        />
        <div style={{ color: '#666', fontSize: 12 }}>
          Leave empty / {'{}'} for none.
        </div>
      </label>

      <button type="submit" disabled={submitting} style={{ padding: 10 }}>
        {submitting ? 'Submitting…' : submitLabel}
      </button>
    </form>
  );
}
