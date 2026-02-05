import { getApiBase } from '@/lib/api';
import { NewVersionForm } from './NewVersionForm';

type PromptVersion = {
  id: string;
  prompt_id: string;
  version: number;
  content: string;
  parameters?: Record<string, unknown> | null;
  created_at: string;
};

type PromptDetail = {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  versions: PromptVersion[];
};

async function fetchPrompt(promptId: string): Promise<PromptDetail> {
  const res = await fetch(`${getApiBase()}/api/prompts/${promptId}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to load prompt: ${res.status} ${text}`);
  }
  return res.json();
}

export default async function PromptDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const prompt = await fetchPrompt(id);
  const latest = prompt.versions.reduce<PromptVersion | null>((acc, v) => {
    if (!acc) return v;
    return v.version > acc.version ? v : acc;
  }, null);

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 980 }}>
      <p>
        <a href="/prompts">← Back to list</a>
      </p>

      <h1 style={{ marginBottom: 6 }}>{prompt.name}</h1>
      {prompt.description ? <p>{prompt.description}</p> : null}
      <p style={{ color: '#666', marginTop: 0 }}>
        Latest: <strong>v{latest?.version ?? '?'}</strong> · Prompt ID:{' '}
        <code>{prompt.id}</code>
      </p>

      <hr style={{ margin: '16px 0' }} />

      <h2>Versions</h2>
      {prompt.versions.length === 0 ? (
        <p>No versions yet (unexpected).</p>
      ) : (
        <ul>
          {[...prompt.versions]
            .sort((a, b) => b.version - a.version)
            .map((v) => (
              <li key={v.id} style={{ marginBottom: 16 }}>
                <div>
                  <strong>v{v.version}</strong>{' '}
                  <span style={{ color: '#666', fontSize: 12 }}>
                    ({new Date(v.created_at).toLocaleString()})
                  </span>
                </div>
                <pre
                  style={{
                    background: '#f6f8fa',
                    padding: 12,
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    borderRadius: 6,
                    marginTop: 8,
                  }}
                >
                  {v.content}
                </pre>
                <details style={{ marginTop: 8 }}>
                  <summary>Parameters</summary>
                  <pre
                    style={{
                      background: '#f6f8fa',
                      padding: 12,
                      overflowX: 'auto',
                      borderRadius: 6,
                    }}
                  >
                    {JSON.stringify(v.parameters ?? null, null, 2)}
                  </pre>
                </details>
              </li>
            ))}
        </ul>
      )}

      <hr style={{ margin: '16px 0' }} />
      <NewVersionForm promptId={prompt.id} />

      <hr style={{ margin: '24px 0' }} />
      <p style={{ color: '#666' }}>
        API base: <code>{getApiBase()}</code>
      </p>
    </main>
  );
}
