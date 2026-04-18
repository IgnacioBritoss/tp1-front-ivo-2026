import { sql } from './db';
import { getSessionFromRequest } from './session';

export async function getUserIdOrNull(request: Request): Promise<string | null> {
  const session = await getSessionFromRequest(request);
  if (!session?.email) return null;

  const email = session.email;
  const name = session.name ?? null;
  const image = session.picture ?? null;

  await sql`
    INSERT INTO users (id, email, name, image)
    VALUES (${email}, ${email}, ${name}, ${image})
    ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name, image = EXCLUDED.image
    RETURNING id
  `;

  return email;
}