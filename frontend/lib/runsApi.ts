import { getApiBase } from '@/lib/api';
import type { Run, RunCreateIn } from '@/lib/types';

async function readError(res: Response) {
  try {
    const text = await res.text();
    return text || res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function listRuns(opts?: {
  prompt_id?: string;
  limit?: number;
  offset?: number;
}): Promise<Run[]> {
  const params = new URLSearchParams();
  if (opts?.prompt_id) params.set('prompt_id', opts.prompt_id);
  if (opts?.limit != null) params.set('limit', String(opts.limit));
  if (opts?.offset != null) params.set('offset', String(opts.offset));

  const qs = params.toString();
  const url = `${getApiBase()}/api/runs${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load runs: ${res.status} ${await readError(res)}`);
  return res.json();
}

export async function getRun(id: string): Promise<Run> {
  const res = await fetch(`${getApiBase()}/api/runs/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load run: ${res.status} ${await readError(res)}`);
  return res.json();
}

export async function createRun(payload: RunCreateIn): Promise<Run> {
  const res = await fetch(`${getApiBase()}/api/runs`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to queue run: ${res.status} ${await readError(res)}`);
  return res.json();
}
