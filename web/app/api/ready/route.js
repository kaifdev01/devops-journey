

export async function GET() {
  const apiUrl = process.env.API_URL || 'http://localhost:5000';
  try {
    const res = await fetch(`${apiUrl}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2000),
    });
    const api = await res.json();
    return Response.json(
      { status: res.ok ? 'ok' : 'degraded', service: 'web', api: api.status, db: api.db },
      { status: res.ok ? 200 : 503 }
    );
  } catch {
    return Response.json(
      { status: 'degraded', service: 'web', api: 'unreachable' },
      { status: 503 }
    );
  }
}
