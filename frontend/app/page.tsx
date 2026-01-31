export default function Home() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>llm-evals-platform</h1>
      <p>Monorepo scaffold: FastAPI + Next.js + Postgres.</p>
      <ul>
        <li>Backend health: <code>/health</code></li>
        <li>Next up: Prompt Registry CRUD</li>
      </ul>
    </main>
  );
}
