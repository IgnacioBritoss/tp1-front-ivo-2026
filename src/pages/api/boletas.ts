import type { APIRoute } from 'astro';
import { sql } from '../../lib/db';
import { getUserIdOrNull } from '../../lib/auth-helper';

export const GET: APIRoute = async ({ request }) => {
  const userId = await getUserIdOrNull(request);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const rows = await sql`
    SELECT id, jugadas, sorteos, cantidad_sorteos, costo_total, premio_total, aciertos, created_at
    FROM boletas
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 20
  `;

  return new Response(JSON.stringify(rows), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const userId = await getUserIdOrNull(request);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const body = await request.json();
  const { jugadas, sorteos, cantidadSorteos, costoTotal, premioTotal, aciertos } = body;

  // Insertamos la boleta
  await sql`
    INSERT INTO boletas (user_id, jugadas, sorteos, cantidad_sorteos, costo_total, premio_total, aciertos)
    VALUES (
      ${userId},
      ${JSON.stringify(jugadas)}::jsonb,
      ${JSON.stringify(sorteos)}::jsonb,
      ${cantidadSorteos},
      ${costoTotal},
      ${premioTotal},
      ${JSON.stringify(aciertos ?? [])}::jsonb
    )
  `;

  // Mantener solo las últimas 20 boletas del usuario
  await sql`
    DELETE FROM boletas
    WHERE user_id = ${userId}
    AND id NOT IN (
      SELECT id FROM boletas
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 20
    )
  `;

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};