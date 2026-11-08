// Cloudflare Worker: safe bootstrap for Scales & Seeds cloud save API.
// Deployment currently exposes health only. Player data routes are intentionally disabled.
// Bind a D1 database as "DB" to scales-seeds-player-saves.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/health') {
      return Response.json({
        service: 'scales-seeds-save-api',
        status: 'setup',
        databaseConnected: Boolean(env.DB)
      }, { headers: { 'Cache-Control': 'no-store' } });
    }
    return new Response('Not Found', {
      status: 404,
      headers: { 'Cache-Control': 'no-store' }
    });
  }
};
