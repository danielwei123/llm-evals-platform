import Link from 'next/link';

import { QueueRunClient } from './ui';

export default function NewRunPage() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <p>
        <Link href="/runs">← Back to runs</Link>
      </p>
      <h1>Queue a run</h1>
      <QueueRunClient />
    </main>
  );
}
