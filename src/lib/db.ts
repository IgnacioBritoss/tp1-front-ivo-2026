import { neon } from '@neondatabase/serverless';

// @ts-ignore
export const sql = neon(import.meta.env.DATABASE_URL);