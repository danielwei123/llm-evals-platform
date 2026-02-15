import { getApiBase } from '@/lib/api';
import { listPrompts } from '@/lib/promptsApi';

export default async function PromptsPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const q = (searchParams?.q ?? '').trim();
  const prompts = await listPrompts({ q: q || undefined, limit: 100, offset: 0 });

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Prompt Registry</h1>
      <p>Minimal v0 list view.</p>
      <p>
        <a href="/prompts/new">Create a new prompt</a>
      </p>

      <form method="GET" style={{ margin: '16px 0', display: 'flex', gap: 8 }}>
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search prompts…"
          style={{ padding: 8, width: 320, maxWidth: '100%' }}
        />
        <button type="submit" style={{ padding: '8px 12px' }}>
          Search
        </button>
        {q ? (
          <a href="/prompts" style={{ alignSelf: 'center' }}>
            Clear
          </a>
        ) : null}
      </form>

      {prompts.length === 0 ? (
        <p>{q ? 'No prompts match your search.' : 'No prompts yet. Use the API to create one.'}</p>
      ) : (
        <ul>
          {prompts.map((p) => (
            <li key={p.id} style={{ marginBottom: 12 }}>
              <div>
                <a href={`/prompts/${p.id}`}>
                  <strong>{p.name}</strong>
                </a>{' '}
                <span style={{ color: '#666' }}>
                  (active v{p.active_version}, latest v{p.latest_version?.version ?? '?'})
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
