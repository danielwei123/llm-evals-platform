import { getApiBase } from '@/lib/api';
import type {
  PromptCreateIn,
  PromptDetail,
  PromptListItem,
  PromptUpdateIn,
  PromptVersion,
  PromptVersionCreateIn,
} from '@/lib/types';

async function readError(res: Response) {
  try {
    const text = await res.text();
    return text || res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function listPrompts(opts?: {
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<PromptListItem[]> {
  const params = new URLSearchParams();
  if (opts?.q) params.set('q', opts.q);
  if (opts?.limit != null) params.set('limit', String(opts.limit));
  if (opts?.offset != null) params.set('offset', String(opts.offset));

  const qs = params.toString();
  const url = `${getApiBase()}/api/prompts${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load prompts: ${res.status} ${await readError(res)}`);
  return res.json();
}

export async function getPrompt(promptId: string): Promise<PromptDetail> {
  const res = await fetch(`${getApiBase()}/api/prompts/${promptId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load prompt: ${res.status} ${await readError(res)}`);
  return res.json();
}

export async function createPrompt(payload: PromptCreateIn): Promise<PromptDetail> {
  const res = await fetch(`${getApiBase()}/api/prompts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create prompt: ${res.status} ${await readError(res)}`);
  return res.json();
}

export async function updatePrompt(promptId: string, payload: PromptUpdateIn): Promise<PromptDetail> {
  const res = await fetch(`${getApiBase()}/api/prompts/${promptId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to update prompt: ${res.status} ${await readError(res)}`);
  return res.json();
}

export async function createPromptVersion(
  promptId: string,
  payload: PromptVersionCreateIn
): Promise<PromptVersion> {
  const res = await fetch(`${getApiBase()}/api/prompts/${promptId}/versions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok)
    throw new Error(`Failed to create prompt version: ${res.status} ${await readError(res)}`);
  return res.json();
}

export async function activatePromptVersion(promptId: string, version: number): Promise<PromptDetail> {
  const res = await fetch(`${getApiBase()}/api/prompts/${promptId}/activate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ version }),
  });
  if (!res.ok)
    throw new Error(`Failed to activate prompt version: ${res.status} ${await readError(res)}`);
  return res.json();
}

export async function deletePrompt(promptId: string): Promise<void> {
  const res = await fetch(`${getApiBase()}/api/prompts/${promptId}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404)
    throw new Error(`Failed to delete prompt: ${res.status} ${await readError(res)}`);
}
