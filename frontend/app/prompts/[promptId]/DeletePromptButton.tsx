'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { getApiBase } from '@/lib/api';

export function DeletePromptButton({
  promptId,
  promptName,
}: {
  promptId: string;
  promptName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    setError(null);

    const ok = window.confirm(
      `Delete prompt “${promptName}”?\n\nThis will permanently delete all versions.`
    );
    if (!ok) return;

    try {
      setBusy(true);
      const res = await fetch(`${getApiBase()}/api/prompts/${promptId}`, {
        method: 'DELETE',
      });

      if (!res.ok && res.status !== 204) {
        const text = await res.text();
        throw new Error(`Delete failed: ${res.status} ${text}`);
      }

      router.push('/prompts');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={onDelete}
        disabled={busy}
        style={{
          background: '#b42318',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          padding: '8px 12px',
          cursor: busy ? 'not-allowed' : 'pointer',
        }}
      >
        {busy ? 'Deleting…' : 'Delete prompt'}
      </button>
      {error ? (
        <p style={{ color: '#b42318', marginTop: 8 }}>{error}</p>
      ) : null}
    </div>
  );
}
