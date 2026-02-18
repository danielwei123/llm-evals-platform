import Link from 'next/link';

import { getPrompt } from '@/lib/promptsApi';
import { PromptDetailClient } from '@/components/PromptDetailClient';

export default async function PromptDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const prompt = await getPrompt(id);

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <p>
        <Link href="/prompts">← Back to prompts</Link>
      </p>
      <h1 style={{ marginBottom: 4 }}>{prompt.name}</h1>
      <div style={{ color: '#666', fontSize: 12 }}>
        Active v{prompt.active_version} • {prompt.versions.length} version(s)
      </div>

      <div style={{ marginTop: 16 }}>
        <PromptDetailClient prompt={prompt} />
      </div>
    </main>
  );
}
