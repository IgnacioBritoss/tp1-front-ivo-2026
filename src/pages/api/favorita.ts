import type { APIRoute } from 'astro';
import { sql } from '../../lib/db';
import { getUserIdOrNull } from '../../lib/auth-helper';

export const GET: APIRoute = async ({ request }) => {
  const userId = await getUserIdOrNull(request);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const rows = await sql`
    SELECT nombre, jugadas, updated_at
    FROM jugada_favorita
    WHERE user_id = ${userId}
  `;

  if (rows.length === 0) {
    return new Response(JSON.stringify(null), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(rows[0]), {
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
  const { nombre, jugadas } = body;

  // Validaciones
  if (!Array.isArray(jugadas) || jugadas.length === 0 || jugadas.length > 25) {
    return new Response(JSON.stringify({ error: 'Jugadas inválidas' }), { status: 400 });
  }

  const MONTO_MAX = 50000;
  for (const j of jugadas) {
    if (typeof j.numero !== 'number' || typeof j.cifras !== 'number') {
      return new Response(JSON.stringify({ error: 'Formato inválido' }), { status: 400 });
    }
    if (j.cabeza > MONTO_MAX || j.cinco > MONTO_MAX || j.diez > MONTO_MAX) {
      return new Response(JSON.stringify({ error: 'Montos superan el máximo' }), { status: 400 });
    }
  }

  const nombreSafe = (typeof nombre === 'string' && nombre.trim().length > 0)
    ? nombre.trim().slice(0, 50)
    : 'Mi jugada favorita';

  await sql`
    INSERT INTO jugada_favorita (user_id, nombre, jugadas, updated_at)
    VALUES (${userId}, ${nombreSafe}, ${JSON.stringify(jugadas)}::jsonb, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      nombre = EXCLUDED.nombre,
      jugadas = EXCLUDED.jugadas,
      updated_at = NOW()
  `;

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};

export const DELETE: APIRoute = async ({ request }) => {
  const userId = await getUserIdOrNull(request);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  await sql`DELETE FROM jugada_favorita WHERE user_id = ${userId}`;

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};