import type { APIRoute } from 'astro';
import { sql } from '../../lib/db';
import { getUserIdOrNull } from '../../lib/auth-helper';

export const GET: APIRoute = async ({ request }) => {
  const userId = await getUserIdOrNull(request);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const rows = await sql`
    SELECT boletas_jugadas, dinero_gastado, dinero_ganado,
           frecuencia_2_cifras, frecuencia_3_cifras
    FROM user_stats
    WHERE user_id = ${userId}
  `;

  if (rows.length === 0) {
    // Si no hay stats aún, devolvemos defaults
    return new Response(JSON.stringify({
      boletas_jugadas: 0,
      dinero_gastado: 0,
      dinero_ganado: 0,
      frecuencia_2_cifras: new Array(100).fill(0),
      frecuencia_3_cifras: new Array(1000).fill(0),
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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
  let { boletas_jugadas, dinero_gastado, dinero_ganado, frecuencia_2_cifras, frecuencia_3_cifras } = body;

  // Límites de seguridad
  const MAX_BIGINT = 9_000_000_000_000;  // 9 billones, muy por debajo del límite de BIGINT

  if (typeof boletas_jugadas !== 'number' || boletas_jugadas < 0 || boletas_jugadas > 1_000_000) {
    return new Response(JSON.stringify({ error: 'Boletas jugadas inválido' }), { status: 400 });
  }
  if (typeof dinero_gastado !== 'number' || dinero_gastado < 0 || dinero_gastado > MAX_BIGINT) {
    return new Response(JSON.stringify({ error: 'Dinero gastado inválido' }), { status: 400 });
  }
  if (typeof dinero_ganado !== 'number' || dinero_ganado < 0 || dinero_ganado > MAX_BIGINT) {
    return new Response(JSON.stringify({ error: 'Dinero ganado inválido' }), { status: 400 });
  }
  if (!Array.isArray(frecuencia_2_cifras) || frecuencia_2_cifras.length !== 100) {
    return new Response(JSON.stringify({ error: 'Frecuencia 2 cifras inválida' }), { status: 400 });
  }
  if (!Array.isArray(frecuencia_3_cifras) || frecuencia_3_cifras.length !== 1000) {
    return new Response(JSON.stringify({ error: 'Frecuencia 3 cifras inválida' }), { status: 400 });
  }

  await sql`
    INSERT INTO user_stats (user_id, boletas_jugadas, dinero_gastado, dinero_ganado, frecuencia_2_cifras, frecuencia_3_cifras, updated_at)
    VALUES (
      ${userId},
      ${boletas_jugadas},
      ${dinero_gastado},
      ${dinero_ganado},
      ${JSON.stringify(frecuencia_2_cifras)}::jsonb,
      ${JSON.stringify(frecuencia_3_cifras)}::jsonb,
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      boletas_jugadas = EXCLUDED.boletas_jugadas,
      dinero_gastado = EXCLUDED.dinero_gastado,
      dinero_ganado = EXCLUDED.dinero_ganado,
      frecuencia_2_cifras = EXCLUDED.frecuencia_2_cifras,
      frecuencia_3_cifras = EXCLUDED.frecuencia_3_cifras,
      updated_at = NOW()
  `;

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};

export const DELETE: APIRoute = async ({ request }) => {
  const userId = await getUserIdOrNull(request);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  await sql`DELETE FROM user_stats WHERE user_id = ${userId}`;
  await sql`DELETE FROM boletas WHERE user_id = ${userId}`;

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};