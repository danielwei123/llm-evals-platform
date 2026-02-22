import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>llm-evals-platform</h1>
      <p>Monorepo scaffold: FastAPI + Next.js + Postgres.</p>
      <ul>
        <li>
          Backend health: <code>/health</code>
        </li>
        <li>
          Prompt Registry: <Link href="/prompts">/prompts</Link>
        </li>
        <li>
          Runs: <Link href="/runs">/runs</Link>
        </li>
      </ul>
    </main>
  );
}
