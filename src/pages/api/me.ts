import type { APIRoute } from 'astro';
import { sql } from '../../lib/db';
import { getUserIdOrNull } from '../../lib/auth-helper';

// Lista cerrada de avatars válidos (URLs de DiceBear como CDN)
const AVATARS_VALIDOS = [
  // Bottts - robots
  'https://api.dicebear.com/9.x/bottts/svg?seed=quiniela-1',
  'https://api.dicebear.com/9.x/bottts/svg?seed=quiniela-2',
  'https://api.dicebear.com/9.x/bottts/svg?seed=quiniela-3',
  'https://api.dicebear.com/9.x/bottts/svg?seed=quiniela-4',
  // Adventurer - personajes estilo cartoon
  'https://api.dicebear.com/9.x/adventurer/svg?seed=britos-1',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=britos-2',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=britos-3',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=britos-4',

  'https://api.dicebear.com/9.x/adventurer/svg?seed=britos-66',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=britos-77',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=britos-33',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=britos-44',

  'https://api.dicebear.com/9.x/adventurer/svg?seed=britos-4266',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=britos-734',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=britos-243',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=britos-44244',
  // Avataaars - estilo mono color
  'https://api.dicebear.com/9.x/avataaars/svg?seed=quini-1',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=quini-2',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=quini-3',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=quini-4',
  // Lorelei - estilo minimal
  'https://api.dicebear.com/9.x/lorelei/svg?seed=tero-1',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=tero-2',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=tero-3',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=tero-4',
];

export const GET: APIRoute = async ({ request }) => {
  const userId = await getUserIdOrNull(request);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const rows = await sql`
    SELECT id, name, email, image, avatar_url, display_name
    FROM users
    WHERE id = ${userId}
  `;

  if (rows.length === 0) {
    return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), { status: 404 });
  }

  const user = rows[0];
  return new Response(JSON.stringify({
    email: user.email,
    name: user.name,
    googleImage: user.image,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    avatarsDisponibles: AVATARS_VALIDOS,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const userId = await getUserIdOrNull(request);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const body = await request.json();
  const { displayName, avatarUrl } = body;

  // Validar displayName
  if (displayName !== null && displayName !== undefined) {
    if (typeof displayName !== 'string' || displayName.trim().length === 0 || displayName.length > 50) {
      return new Response(JSON.stringify({ error: 'Nombre inválido' }), { status: 400 });
    }
  }

  // Validar avatarUrl (solo aceptar avatars de la lista cerrada)
  if (avatarUrl !== null && avatarUrl !== undefined) {
    if (typeof avatarUrl !== 'string' || !AVATARS_VALIDOS.includes(avatarUrl)) {
      return new Response(JSON.stringify({ error: 'Avatar inválido' }), { status: 400 });
    }
  }

  const nombreSafe = displayName ? displayName.trim().slice(0, 50) : null;

  await sql`
    UPDATE users
    SET display_name = ${nombreSafe},
        avatar_url = ${avatarUrl ?? null}
    WHERE id = ${userId}
  `;

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};