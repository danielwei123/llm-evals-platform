'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { PromptDetail } from '@/lib/types';
import {
  activatePromptVersion,
  createPromptVersion,
  deletePrompt,
  updatePrompt,
} from '@/lib/promptsApi';

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

  const [activating, setActivating] = useState(false);
  const [activeVersion, setActiveVersion] = useState<number>(prompt.active_version);

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
        <h2 style={{ marginTop: 0 }}>Active version</h2>

        <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>
          This controls what version is considered “prod” / currently active.
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>Activate</span>
            <select
              value={String(activeVersion)}
              onChange={(e) => setActiveVersion(Number(e.target.value))}
              style={{ padding: 6 }}
            >
              {prompt.versions.map((v) => (
                <option key={v.id} value={v.version}>
                  v{v.version}
                </option>
              ))}
            </select>
          </label>

          <button
            disabled={activating || activeVersion === prompt.active_version}
            onClick={async () => {
              setError(null);
              setActivating(true);
              try {
                await activatePromptVersion(prompt.id, activeVersion);
                router.refresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
              } finally {
                setActivating(false);
              }
            }}
            style={{ padding: '8px 12px' }}
          >
            {activating ? 'Activating…' : 'Activate'}
          </button>

          {activeVersion === prompt.active_version ? (
            <span style={{ color: '#666', fontSize: 12 }}>Already active.</span>
          ) : null}
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

      <section style={{ padding: 12, border: '1px solid #ddd' }}>
        <h2 style={{ marginTop: 0 }}>Versions</h2>
        <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>
          Ordered newest → oldest.
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {prompt.versions.map((v) => (
            <div key={v.id} style={{ padding: 12, background: '#fafafa', border: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <strong>
                  v{v.version}{v.version === prompt.active_version ? ' (active)' : ''}
                </strong>
                <span style={{ color: '#666', fontSize: 12 }}>
                  {new Date(v.created_at).toLocaleString()}
                </span>
              </div>

              <div style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 12, color: '#444' }}>Content</div>
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
                  {v.content}
                </pre>
              </div>

              <div style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 12, color: '#444' }}>Parameters</div>
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
                  {toJsonPretty(v.parameters)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
