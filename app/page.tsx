async function getPicks() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const url = new URL('/api/picks', baseUrl).toString();
  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) {
    throw new Error('Failed to fetch picks');
  }

  return res.json() as Promise<Array<Record<string, unknown>>>;
}

export default async function HomePage() {
  const picks = await getPicks();

  return (
    <main className="page-shell">
      <section className="hero">
        <h1>Agora Agent</h1>
        <p>AI-powered Polymarket prediction market analysis and pick tracking.</p>
      </section>

      <section className="controls">
        <form action="/api/agent" method="post">
          <button type="submit">Run Agent Now</button>
        </form>
      </section>

      <section className="grid">
        {picks.length === 0 ? (
          <p>No picks available yet. Run the agent to generate picks.</p>
        ) : (
          picks.map((pick) => {
            const createdAt = typeof pick.created_at === 'string' ? pick.created_at : '';
            const createdAtText = createdAt ? new Date(createdAt).toLocaleString() : '';
            return (
              <article key={String(pick.id)} className="card">
                <h2>{String(pick.question)}</h2>
                <p>
                  <strong>Pick:</strong> {String(pick.pick)} • <strong>Confidence:</strong>{' '}
                  {String(pick.confidence)}%
                </p>
                <p>{String(pick.reasoning)}</p>
                <p className="meta">
                  <span>{String(pick.outcome ?? 'PENDING')}</span>
                  {createdAtText ? <span>{createdAtText}</span> : null}
                </p>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}
