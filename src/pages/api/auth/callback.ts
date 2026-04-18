import type { APIRoute } from 'astro';
import { createSessionToken, getSessionCookieHeader } from '../../../lib/session';

function getOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');

  const host = forwardedHost ?? url.host;
  const proto = forwardedProto ?? url.protocol.replace(':', '');

  return `${proto}://${host}`;
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    return new Response(`Error de OAuth: ${error}`, { status: 400 });
  }

  if (!code) {
    return new Response('Falta el parámetro code', { status: 400 });
  }

  const cookieHeader = request.headers.get('cookie') ?? '';
  const stateMatch = cookieHeader.match(/oauth_state=([^;]+)/);
  const savedState = stateMatch ? stateMatch[1] : null;

  if (!savedState || savedState !== state) {
    return new Response('State inválido', { status: 400 });
  }

  // @ts-ignore
  const clientId = import.meta.env.GOOGLE_CLIENT_ID;
  // @ts-ignore
  const clientSecret = import.meta.env.GOOGLE_CLIENT_SECRET;

  const origin = getOrigin(request);
  const redirectUri = `${origin}/api/auth/callback`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error('Error intercambiando token:', errText);
    return new Response('No se pudo validar con Google', { status: 500 });
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!userRes.ok) {
    return new Response('No se pudo obtener info del usuario', { status: 500 });
  }

  const userInfo = await userRes.json();

  if (!userInfo.email || !userInfo.email_verified) {
    return new Response('Email no verificado', { status: 400 });
  }

  const sessionToken = await createSessionToken({
    email: userInfo.email,
    name: userInfo.name ?? null,
    picture: userInfo.picture ?? null,
  });

  const sessionCookie = getSessionCookieHeader(sessionToken);

  const headers = new Headers();
  headers.append('Location', '/');
  headers.append('Set-Cookie', sessionCookie);
  headers.append('Set-Cookie', 'oauth_state=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0');

  return new Response(null, { status: 302, headers });
};