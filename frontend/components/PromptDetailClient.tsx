'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { PromptDetail } from '@/lib/types';
import { createPromptVersion, deletePrompt, updatePrompt } from '@/lib/promptsApi';

function toJsonPretty(obj: unknown): string {
  if (obj == null) return '';
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

export function PromptDetailClient({ prompt }: { prompt: PromptDetail }) {
  const router = useRouter();

  const latest = useMemo(() => prompt.versions?.[0] ?? null, [prompt.versions]);

  const [description, setDescription] = useState(prompt.description ?? '');
  const [savingMeta, setSavingMeta] = useState(false);

  const [newContent, setNewContent] = useState('');
  const [newParametersJson, setNewParametersJson] = useState('');
  const [creatingVersion, setCreatingVersion] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {error ? (
        <div style={{ padding: 12, background: '#fee', border: '1px solid #f99' }}>
          <strong>Error:</strong> {error}
        </div>
      ) : null}

      <section style={{ padding: 12, border: '1px solid #ddd' }}>
        <h2 style={{ marginTop: 0 }}>Metadata</h2>

        <label style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontWeight: 600 }}>Description</div>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="(optional)"
            style={{ width: '100%', padding: 8 }}
          />
        </label>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            disabled={savingMeta}
            onClick={async () => {
              setError(null);
              setSavingMeta(true);
              try {
                await updatePrompt(prompt.id, { description: description || null });
                router.refresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
              } finally {
                setSavingMeta(false);
              }
            }}
            style={{ padding: '8px 12px' }}
          >
            {savingMeta ? 'Saving…' : 'Save'}
          </button>

          <button
            disabled={deleting}
            onClick={async () => {
              const ok = window.confirm(
                `Delete prompt “${prompt.name}”? This will delete all versions.`
              );
              if (!ok) return;

              setError(null);
              setDeleting(true);
              try {
                await deletePrompt(prompt.id);
                router.push('/prompts');
              } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
              } finally {
                setDeleting(false);
              }
            }}
            style={{ padding: '8px 12px', background: '#fff', border: '1px solid #f66' }}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </section>

      <section style={{ padding: 12, border: '1px solid #ddd' }}>
        <h2 style={{ marginTop: 0 }}>Create new version</h2>

        <label style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontWeight: 600 }}>Content</div>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={10}
            style={{ width: '100%', padding: 8, fontFamily: 'ui-monospace, Menlo, monospace' }}
            placeholder={latest?.content ?? 'Write prompt content…'}
          />
        </label>

        <label style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontWeight: 600 }}>Parameters (JSON)</div>
          <textarea
            value={newParametersJson}
            onChange={(e) => setNewParametersJson(e.target.value)}
            rows={6}
            style={{ width: '100%', padding: 8, fontFamily: 'ui-monospace, Menlo, monospace' }}
            placeholder={toJsonPretty(latest?.parameters ?? {})}
          />
          <div style={{ color: '#666', fontSize: 12 }}>
            Leave empty to store <code>null</code>.
          </div>
        </label>

        <button
          disabled={creatingVersion}
          onClick={async () => {
            setError(null);
            setCreatingVersion(true);
            try {
              const params = newParametersJson.trim();
              const parsed = params.length === 0 ? null : JSON.parse(params);

              await createPromptVersion(prompt.id, {
                content: newContent.trim().length > 0 ? newContent : latest?.content ?? '',
                parameters: parsed,
              });

              setNewContent('');
              setNewParametersJson('');
              router.refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e));
            } finally {
              setCreatingVersion(false);
            }
          }}
          style={{ padding: '8px 12px', marginTop: 12 }}
        >
          {creatingVersion ? 'Creating…' : 'Create version'}
        </button>
      </section>
    </div>
  );
}
