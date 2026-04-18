import type { APIRoute } from 'astro';
import { getClearCookieHeader } from '../../../lib/session';

export const POST: APIRoute = async () => {
  const headers = new Headers();
  headers.append('Location', '/');
  headers.append('Set-Cookie', getClearCookieHeader());

  return new Response(null, { status: 302, headers });
};

export const GET: APIRoute = async () => {
  // Permitir también GET por simplicidad
  const headers = new Headers();
  headers.append('Location', '/');
  headers.append('Set-Cookie', getClearCookieHeader());

  return new Response(null, { status: 302, headers });
};