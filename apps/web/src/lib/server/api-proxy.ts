/** Forward local API handlers through the authenticated backend. Never read demo stores on the server. */
export async function proxyApi(request: Request): Promise<Response> {
  const incoming = new URL(request.url);
  const backend = process.env.API_URL || 'http://localhost:3001';
  const destination = new URL('/api/v1/' + incoming.pathname.replace(/^\/api\//, '') + incoming.search, backend);
  const headers = new Headers();
  for (const name of ['authorization', 'content-type', 'accept', 'x-tenant-id']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const response = await fetch(destination, {
      method: request.method, headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
      cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(30000),
    });
    return new Response(response.body, {status:response.status, headers: {
      'Content-Type': response.headers.get('content-type') || 'application/json',
      'Cache-Control': 'no-store',
    }});
  } catch {
    return Response.json({success:false,message:'School service unavailable. Please try again.'}, {status:502,headers:{'Cache-Control':'no-store'}});
  }
}
