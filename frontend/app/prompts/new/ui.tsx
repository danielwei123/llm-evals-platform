'use client';

import { useRouter } from 'next/navigation';

import { PromptForm, type PromptFormValue } from '@/components/PromptForm';
import { createPrompt } from '@/lib/promptsApi';

function parseParameters(json: string): Record<string, unknown> | null {
  const trimmed = json.trim();
  if (trimmed === '' || trimmed === '{}') return null;

  const parsed: unknown = JSON.parse(trimmed);
  if (parsed == null) return null;
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Parameters must be a JSON object (e.g. {"temperature": 0.2}).');
  }
  return parsed as Record<string, unknown>;
}

export function NewPromptClient() {
  const router = useRouter();

  return (
    <PromptForm
      submitLabel="Create"
      onSubmit={async (value: PromptFormValue) => {
        const created = await createPrompt({
          name: value.name.trim(),
          description: value.description.trim() || null,
          content: value.content,
          parameters: parseParameters(value.parametersJson),
        });

        router.push(`/prompts/${created.id}`);
        router.refresh();
      }}
    />
  );
}
