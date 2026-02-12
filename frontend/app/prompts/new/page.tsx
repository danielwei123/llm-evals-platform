'use client';

import { useRouter } from 'next/navigation';
import { PromptForm } from '@/components/PromptForm';
import { createPrompt } from '@/lib/promptsApi';

export default function NewPromptPage() {
  const router = useRouter();

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <p>
        <a href="/prompts">← Back to prompts</a>
      </p>
      <h1>Create prompt</h1>

      <PromptForm
        submitLabel="Create"
        onSubmit={async (value) => {
          const parameters = value.parametersJson.trim();
          const parsed = parameters.length === 0 ? null : JSON.parse(parameters);

          const created = await createPrompt({
            name: value.name,
            description: value.description || null,
            content: value.content,
            parameters: parsed,
          });

          router.push(`/prompts/${created.id}`);
        }}
      />

      <p style={{ color: '#666', marginTop: 16 }}>
        Creates version <code>v1</code>.
      </p>
    </main>
  );
}
