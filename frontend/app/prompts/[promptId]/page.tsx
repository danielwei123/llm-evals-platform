import { getPrompt } from '@/lib/promptsApi';
import { PromptDetailClient } from '@/components/PromptDetailClient';

export default async function PromptDetailPage({
  params,
}: {
  params: { promptId: string };
}) {
  const prompt = await getPrompt(params.promptId);

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24, display: 'grid', gap: 16 }}>
      <p>
        <a href="/prompts">← Back to prompts</a>
      </p>

      <header>
        <h1 style={{ marginBottom: 4 }}>{prompt.name}</h1>
        <div style={{ color: '#666' }}>
          Prompt ID: <code>{prompt.id}</code>
        </div>
      </header>

      <section style={{ padding: 12, border: '1px solid #ddd' }}>
        <h2 style={{ marginTop: 0 }}>Versions</h2>
        {prompt.versions.length === 0 ? (
          <p>No versions.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {prompt.versions.map((v) => (
              <li key={v.id} style={{ marginBottom: 12 }}>
                <div>
                  <strong>v{v.version}</strong>{' '}
                  <span style={{ color: '#666', fontSize: 12 }}>{new Date(v.created_at).toISOString()}</span>
                </div>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    background: '#fafafa',
                    border: '1px solid #eee',
                    padding: 12,
                    overflowX: 'auto',
                  }}
                >
                  {v.content}
                </pre>
                {v.parameters ? (
                  <details>
                    <summary>Parameters</summary>
                    <pre style={{ background: '#fafafa', border: '1px solid #eee', padding: 12 }}>
                      {JSON.stringify(v.parameters, null, 2)}
                    </pre>
                  </details>
                ) : (
                  <div style={{ color: '#666', fontSize: 12 }}>Parameters: null</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <PromptDetailClient prompt={prompt} />
    </main>
  );
}
