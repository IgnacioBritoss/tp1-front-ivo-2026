import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = 'app_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

function getSecretKey(): Uint8Array {
  // @ts-ignore
  const secret = import.meta.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET no configurado');
  return new TextEncoder().encode(secret);
}

export type SessionData = {
  email: string;
  name?: string | null;
  picture?: string | null;
};

export async function createSessionToken(data: SessionData): Promise<string> {
  return await new SignJWT({ ...data })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      email: payload.email as string,
      name: (payload.name as string) ?? null,
      picture: (payload.picture as string) ?? null,
    };
  } catch {
    return null;
  }
}

export function getSessionCookieHeader(token: string): string {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${COOKIE_MAX_AGE}`;
}

export function getClearCookieHeader(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
}

export function getSessionFromRequest(request: Request): Promise<SessionData | null> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return Promise.resolve(null);

  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [key, ...rest] = c.trim().split('=');
      return [key, rest.join('=')];
    })
  );

  const token = cookies[COOKIE_NAME];
  if (!token) return Promise.resolve(null);

  return verifySessionToken(token);
}

export { COOKIE_NAME };