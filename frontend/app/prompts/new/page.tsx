import Link from 'next/link';

import { NewPromptClient } from './ui';

export default function NewPromptPage() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 920 }}>
      <p style={{ marginTop: 0 }}>
        <Link href="/prompts">← Back to prompts</Link>
      </p>
      <h1>Create prompt</h1>
      <p style={{ color: '#666' }}>
        Creates a new prompt and its immutable <strong>v1</strong>.
      </p>

      <NewPromptClient />
    </main>
  );
}
