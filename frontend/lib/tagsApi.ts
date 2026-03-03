import { getApiBase } from '@/lib/api';
import type { TagListItem } from '@/lib/types';

async function readError(res: Response) {
  try {
    const text = await res.text();
    return text || res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function listTags(opts?: {
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<TagListItem[]> {
  const params = new URLSearchParams();
  if (opts?.q) params.set('q', opts.q);
  if (opts?.limit != null) params.set('limit', String(opts.limit));
  if (opts?.offset != null) params.set('offset', String(opts.offset));

  const qs = params.toString();
  const url = `${getApiBase()}/api/tags${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load tags: ${res.status} ${await readError(res)}`);
  return res.json();
}
