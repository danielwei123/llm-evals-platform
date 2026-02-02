type PromptVersion = {
  id: string;
  prompt_id: string;
  version: number;
  content: string;
  parameters?: Record<string, unknown> | null;
  created_at: string;
};

type Prompt = {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  latest_version?: PromptVersion | null;
};

function getApiBase() {
  return process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000';
}

async function fetchPrompts(): Promise<Prompt[]> {
  const res = await fetch(`${getApiBase()}/api/prompts`, {
    // v0: always fresh in dev
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to load prompts: ${res.status} ${text}`);
  }
  return res.json();
}

export default async function PromptsPage() {
  const prompts = await fetchPrompts();

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Prompt Registry</h1>
      <p>Minimal v0 list view.</p>
      <p>
        <a href="/prompts/new">Create a new prompt</a>
      </p>

      {prompts.length === 0 ? (
        <p>No prompts yet. Use the API to create one.</p>
      ) : (
        <ul>
          {prompts.map((p) => (
            <li key={p.id} style={{ marginBottom: 12 }}>
              <div>
                <strong>{p.name}</strong>{' '}
                <span style={{ color: '#666' }}>
                  (v{p.latest_version?.version ?? '?'})
                </span>
              </div>
              {p.description ? <div>{p.description}</div> : null}
              <div style={{ color: '#666', fontSize: 12 }}>
                {p.latest_version?.content
                  ? p.latest_version.content.slice(0, 160)
                  : '—'}
                {p.latest_version?.content && p.latest_version.content.length > 160
                  ? '…'
                  : ''}
              </div>
            </li>
          ))}
        </ul>
      )}

      <hr style={{ margin: '24px 0' }} />
      <p style={{ color: '#666' }}>
        API base: <code>{getApiBase()}</code>
      </p>
    </main>
  );
}
