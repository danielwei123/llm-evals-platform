import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PromptDetailClient } from '@/components/PromptDetailClient';
import { getPrompt } from '@/lib/promptsApi';

export default async function PromptDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  let prompt;
  try {
    prompt = await getPrompt(id);
  } catch (e) {
    // If the backend returns 404, our fetch wrapper throws.
    // For now, treat any error as not found to keep routing simple.
    // (We can improve this once we have error boundaries.)
    notFound();
  }

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 980 }}>
      <p style={{ marginTop: 0 }}>
        <Link href="/prompts">← Back to prompts</Link>
      </p>

      <h1 style={{ marginBottom: 4 }}>{prompt.name}</h1>
      <div style={{ color: '#666', fontSize: 12, marginBottom: 16 }}>
        id: <code>{prompt.id}</code>
      </div>

      <PromptDetailClient prompt={prompt} />
    </main>
  );
}
