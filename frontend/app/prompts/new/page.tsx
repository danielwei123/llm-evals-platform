'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { PromptForm } from '@/components/PromptForm';
import { createPrompt } from '@/lib/promptsApi';

function parseOptionalJson(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const parsed = JSON.parse(trimmed);
  if (parsed === null) return null;
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Parameters must be a JSON object (or null)');
  }
  return parsed as Record<string, unknown>;
}

export default function NewPromptPage() {
  const router = useRouter();

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Create Prompt</h1>
      <p>
        <Link href="/prompts">← Back to Prompt Registry</Link>
      </p>

      <PromptForm
        submitLabel="Create"
        onSubmit={async (value) => {
          const parameters = parseOptionalJson(value.parametersJson);
          const created = await createPrompt({
            name: value.name,
            description: value.description || null,
            content: value.content,
            parameters,
          });
          router.push(`/prompts/${created.id}`);
        }}
      />
    </main>
  );
}
