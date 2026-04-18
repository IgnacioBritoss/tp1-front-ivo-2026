import type { APIRoute } from 'astro';

function getOrigin(request: Request): string {
  const url = new URL(request.url);

  // En Vercel, request.url puede venir con "localhost".
  // Usamos x-forwarded-host y x-forwarded-proto si están presentes.
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');

  const host = forwardedHost ?? url.host;
  const proto = forwardedProto ?? url.protocol.replace(':', '');

  return `${proto}://${host}`;
}

export const GET: APIRoute = async ({ request }) => {
  // @ts-ignore
  const clientId = import.meta.env.GOOGLE_CLIENT_ID;

  const origin = getOrigin(request);
  const redirectUri = `${origin}/api/auth/callback`;

  const state = crypto.randomUUID();

  const googleUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleUrl.searchParams.set('client_id', clientId);
  googleUrl.searchParams.set('redirect_uri', redirectUri);
  googleUrl.searchParams.set('response_type', 'code');
  googleUrl.searchParams.set('scope', 'openid email profile');
  googleUrl.searchParams.set('state', state);
  googleUrl.searchParams.set('prompt', 'select_account');

  const stateCookie = `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=600`;

  return new Response(null, {
    status: 302,
    headers: {
      'Location': googleUrl.toString(),
      'Set-Cookie': stateCookie,
    },
  });
};