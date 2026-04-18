import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, redirect }) => {
  // @ts-ignore
  const clientId = import.meta.env.GOOGLE_CLIENT_ID;

  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const redirectUri = `${origin}/api/auth/callback`;

  // Generamos un state aleatorio para protección CSRF
  const state = crypto.randomUUID();

  const googleUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleUrl.searchParams.set('client_id', clientId);
  googleUrl.searchParams.set('redirect_uri', redirectUri);
  googleUrl.searchParams.set('response_type', 'code');
  googleUrl.searchParams.set('scope', 'openid email profile');
  googleUrl.searchParams.set('state', state);
  googleUrl.searchParams.set('prompt', 'select_account');

  // Guardamos el state en una cookie temporal
  const stateCookie = `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=600`;

  return new Response(null, {
    status: 302,
    headers: {
      'Location': googleUrl.toString(),
      'Set-Cookie': stateCookie,
    },
  });
};