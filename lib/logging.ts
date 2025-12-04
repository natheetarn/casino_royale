export function createApiTimer(args: { path: string; method: string }) {
  const startedAt = Date.now();

  return (status: number, extra?: Record<string, unknown>) => {
    const durationMs = Date.now() - startedAt;

    // Structured log line for Vercel / Supabase logs
    console.log(
      JSON.stringify({
        type: 'api_timing',
        path: args.path,
        method: args.method,
        status,
        durationMs,
        ...extra,
      }),
    );
  };
}


