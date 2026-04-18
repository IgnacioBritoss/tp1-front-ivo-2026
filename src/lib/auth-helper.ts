import { getSession } from 'auth-astro/server';
import { sql } from './db';

// Obtiene la sesión actual y asegura que el usuario exista en la tabla users.
// Devuelve el user_id si hay sesión, o null si no.
export async function getUserIdOrNull(request: Request): Promise<string | null> {
  const session = await getSession(request);
  if (!session?.user?.email) return null;

  const email = session.user.email;
  const name = session.user.name ?? null;
  const image = session.user.image ?? null;

  // Upsert: si no existe el usuario, lo crea. Si existe, no hace nada.
  // Usamos el email como id porque Auth.js con JWT no nos da un id estable.
  const result = await sql`
    INSERT INTO users (id, email, name, image)
    VALUES (${email}, ${email}, ${name}, ${image})
    ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name, image = EXCLUDED.image
    RETURNING id
  `;

  return result[0].id as string;
}