import Link from 'next/link';

import { NewPromptClient } from './ui';

export default function NewPromptPage() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <p>
        <Link href="/prompts">← Back to prompts</Link>
      </p>
      <h1>Create prompt</h1>
      <p style={{ color: '#666' }}>Creates prompt v1 and sets it active.</p>
      <NewPromptClient />
    </main>
  );
}
